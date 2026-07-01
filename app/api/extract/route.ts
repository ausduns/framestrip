import JSZip from 'jszip'
import { NextResponse } from 'next/server'
import { cleanHTML } from '@/lib/clean'
import { launchBrowser } from '@/lib/browser'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  let url: string | null = null
  let uploadedHtml: string | null = null
  let uploadedName: string | null = null

  try {
    const formData = await req.formData()
    const urlValue = formData.get('url')
    if (typeof urlValue === 'string' && urlValue.trim()) url = urlValue.trim()

    const htmlFile = formData.get('htmlFile')
    if (htmlFile instanceof File) {
      uploadedName = htmlFile.name || 'uploaded.html'
      uploadedHtml = await htmlFile.text()
    }
  } catch {
    return new NextResponse('Expected multipart/form-data', { status: 400 })
  }

  if (!url && !uploadedHtml)
    return new NextResponse('Provide either "url" or "htmlFile".', { status: 400 })

  const sourceLabel = url ? safeFilename(fromUrlToName(url)) : safeFilename(uploadedName ?? 'uploaded')

  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()

    if (url) {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    } else if (uploadedHtml) {
      await page.setContent(uploadedHtml, { waitUntil: 'networkidle', timeout: 60_000 })
    }

    const renderedHtml = await page.content()
    const title = await page.title().catch(() => '')

    const stripped = cleanHTML(renderedHtml)

    const zip = new JSZip()
    zip.file('index.html', stripped.html)
    zip.file(
      'meta.json',
      JSON.stringify(
        {
          source: url ? { type: 'url', url } : { type: 'upload', fileName: uploadedName },
          title,
          removed: stripped.removed,
          generatedAt: new Date().toISOString()
        },
        null,
        2
      )
    )
    zip.file(
      'README.txt',
      [
        'Framestrip Extractor ZIP',
        '',
        '- index.html: rendered HTML after Playwright (then cleaned)',
        '- meta.json: extraction metadata',
        '',
        'Notes:',
        '- This is a heuristic cleaner; you may need to re-add scripts/styles you actually want.',
        '- For best results, prefer URL mode so the page can fully render before capture.'
      ].join('\n')
    )

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipBody = new Uint8Array(zipBuffer)

    return new Response(zipBody, {
      status: 200,
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${sourceLabel}.zip"`
      }
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Extraction failed'
    return new NextResponse(message, { status: 500 })
  } finally {
    await browser.close()
  }
}

function fromUrlToName(input: string) {
  try {
    const u = new URL(input)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/+$/, '')
    const suffix = path && path !== '/' ? path.split('/').filter(Boolean).slice(-2).join('-') : ''
    return suffix ? `${host}-${suffix}` : host
  } catch {
    return 'extracted'
  }
}

function safeFilename(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return 'extracted'
  return trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'extracted'
}

