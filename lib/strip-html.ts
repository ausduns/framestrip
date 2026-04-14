import * as cheerio from 'cheerio'

export interface StripHtmlResult {
  html: string
  removed: {
    scripts: number
    links: number
    metas: number
    attributes: number
  }
}

export function stripHtmlBloat(inputHtml: string): StripHtmlResult {
  const $ = cheerio.load(inputHtml)

  const removed = {
    scripts: 0,
    links: 0,
    metas: 0,
    attributes: 0
  }

  // Remove obvious runtime/analytics scripts (keep structured data)
  $('script').each((_, el) => {
    const script = $(el)
    const type = (script.attr('type') ?? '').toLowerCase()
    if (type === 'application/ld+json') return

    const src = (script.attr('src') ?? '').toLowerCase()
    const inline = (script.text() ?? '').toLowerCase()

    const isFramer =
      src.includes('framer') ||
      inline.includes('framer') ||
      inline.includes('__framer') ||
      inline.includes('data-framer')

    const isWebflow =
      src.includes('webflow') ||
      inline.includes('webflow') ||
      inline.includes('data-wf') ||
      inline.includes('wf-')

    const isNextRuntime =
      inline.includes('__next') || src.includes('_next') || src.includes('nextjs')

    const isAnalytics =
      src.includes('googletagmanager') ||
      src.includes('google-analytics') ||
      src.includes('gtag/js') ||
      src.includes('segment.com') ||
      src.includes('mixpanel') ||
      src.includes('intercom') ||
      src.includes('hotjar') ||
      inline.includes('gtag(') ||
      inline.includes('fbq(')

    if (isFramer || isWebflow || isNextRuntime || isAnalytics) {
      script.remove()
      removed.scripts += 1
      return
    }

    // Drop very large inline scripts by default (usually runtime)
    if (!src && (script.text()?.length ?? 0) > 20_000) {
      script.remove()
      removed.scripts += 1
    }
  })

  // Remove common preload/prefetch noise & builder-specific stylesheets
  $('link').each((_, el) => {
    const link = $(el)
    const rel = (link.attr('rel') ?? '').toLowerCase()
    const href = (link.attr('href') ?? '').toLowerCase()

    const isNoise =
      rel === 'preconnect' ||
      rel === 'dns-prefetch' ||
      rel === 'prefetch' ||
      rel === 'preload' ||
      rel === 'modulepreload'

    const isBuilderAsset =
      href.includes('framer') ||
      href.includes('webflow') ||
      href.includes('wf-') ||
      href.includes('/_next/')

    if (isNoise || isBuilderAsset) {
      link.remove()
      removed.links += 1
    }
  })

  // Remove generator + builder meta tags
  $('meta').each((_, el) => {
    const meta = $(el)
    const name = (meta.attr('name') ?? '').toLowerCase()
    const content = (meta.attr('content') ?? '').toLowerCase()

    const isGenerator =
      name === 'generator' ||
      content.includes('framer') ||
      content.includes('webflow') ||
      content.includes('next.js') ||
      content.includes('nextjs')

    if (isGenerator) {
      meta.remove()
      removed.metas += 1
    }
  })

  // Remove obvious editor/builder attributes that add noise
  const noisyAttributePrefixes = [
    'data-framer-',
    'data-wf-',
    'data-webflow-',
    'data-ix-',
    'data-animate-',
    'data-editor-'
  ]

  const noisyAttributeNames = new Set([
    'data-framer-name',
    'data-framer-generated',
    'data-framer-component-type',
    'data-w-id',
    'data-wf-page',
    'data-wf-site'
  ])

  $('*').each((_, el) => {
    const attribs =
      el && typeof el === 'object' && 'attribs' in el
        ? (el as unknown as { attribs?: Record<string, string> }).attribs
        : undefined

    for (const attrName of Object.keys(attribs ?? {})) {
      const lower = attrName.toLowerCase()
      if (noisyAttributeNames.has(lower)) {
        $(el).removeAttr(attrName)
        removed.attributes += 1
        continue
      }

      if (noisyAttributePrefixes.some((p) => lower.startsWith(p))) {
        $(el).removeAttr(attrName)
        removed.attributes += 1
      }
    }
  })

  // Remove noscript blocks (usually tracking fallbacks)
  $('noscript').remove()

  // Basic cleanup: drop empty style tags
  $('style').each((_, el) => {
    const style = $(el)
    if ((style.text() ?? '').trim().length === 0) style.remove()
  })

  return {
    html: $.html(),
    removed
  }
}

