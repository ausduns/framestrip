'use client'

import { useMemo, useState } from 'react'

export default function Page() {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReady = useMemo(() => {
    if (isSubmitting) return false
    if (file) return true
    return url.trim().length > 0
  }, [file, isSubmitting, url])

  async function onSubmit() {
    if (!isReady) return
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      if (file) formData.set('htmlFile', file, file.name)
      if (url.trim()) formData.set('url', url.trim())

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Request failed (${res.status})`)
      }

      const blob = await res.blob()
      const downloadName =
        res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        'extracted.zip'

      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white selection:bg-[#8ff5ff]/30">
      <header className="fixed top-0 w-full z-50 bg-[#131313] flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[#8ff5ff] text-xl font-bold tracking-tighter font-[var(--font-headline)]">
            FRAMES<span className="text-[#d674ff]">TRIP</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-[#adaaaa]">
          <span className="text-[#8ff5ff] font-bold">Extractor</span>
          <span>Cleaner</span>
          <span>ZIP Export</span>
        </div>
      </header>

      <main className="pt-24 pb-24 px-6 md:px-12 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#8ff5ff]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#d674ff]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-4xl space-y-10 relative z-10">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-[var(--font-headline)] font-bold tracking-tight">
              HTML <span className="bg-gradient-to-r from-[#8ff5ff] to-[#d674ff] bg-clip-text text-transparent">Extraction</span>
            </h1>
            <p className="text-[#adaaaa] text-lg max-w-2xl mx-auto">
              Paste a URL or upload an HTML file. We render it in Playwright, strip Framer/Webflow bloat, and return a ZIP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8ff5ff]/30 to-[#d674ff]/30 rounded-[28px] blur opacity-30 group-hover:opacity-100 transition duration-700" />
              <div className="relative p-8 md:p-10 bg-[#131313] rounded-[28px] border border-[#8ff5ff]/15">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8ff5ff]">
                      URL input
                    </label>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded-xl bg-[#0e0e0e] border border-[#262626] px-4 py-3 text-sm outline-none focus:border-[#8ff5ff]/60"
                      inputMode="url"
                    />
                    <p className="text-xs text-[#adaaaa]">
                      Tip: for JS-heavy sites (Framer/Webflow), URL mode is usually best.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#262626]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#767575]">or</span>
                    <div className="h-px flex-1 bg-[#262626]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#8ff5ff]">
                      HTML upload
                    </label>
                    <input
                      type="file"
                      accept=".html,text/html"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-[#adaaaa] file:mr-4 file:rounded-lg file:border-0 file:bg-[#262626] file:px-4 file:py-2 file:text-white hover:file:bg-[#2c2c2c]"
                    />
                    {file ? (
                      <p className="text-xs text-[#adaaaa]">
                        Selected: <span className="text-white">{file.name}</span>
                      </p>
                    ) : null}
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-[#ff716c]/40 bg-[#9f0519]/20 px-4 py-3 text-sm text-[#ffa8a3]">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                    <div className="text-xs text-[#adaaaa]">
                      Output: <span className="text-white">index.html</span> + metadata inside a ZIP
                    </div>
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={!isReady}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8ff5ff] to-[#d674ff] text-[#003f43] font-bold shadow-lg shadow-[#8ff5ff]/15 hover:shadow-[#8ff5ff]/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Extracting…' : 'Extract → ZIP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#131313] p-6 rounded-2xl border border-[#262626]">
                <h2 className="text-xs uppercase tracking-widest text-[#8ff5ff] mb-4">
                  What we remove
                </h2>
                <ul className="space-y-2 text-sm text-[#adaaaa]">
                  <li>Framer/Webflow runtime scripts</li>
                  <li>Duplicate/preload noise</li>
                  <li>Tracking pixels + inline bloat</li>
                  <li>CMS/editor-only attributes</li>
                </ul>
              </div>

              <div className="bg-[#131313] p-6 rounded-2xl border border-[#262626]">
                <h2 className="text-xs uppercase tracking-widest text-[#d674ff] mb-4">
                  ZIP contents
                </h2>
                <ul className="space-y-2 text-sm text-[#adaaaa]">
                  <li><span className="text-white">index.html</span> (cleaned)</li>
                  <li><span className="text-white">meta.json</span> (source info)</li>
                  <li><span className="text-white">README.txt</span></li>
                </ul>
              </div>
            </div>
          </div>

          <footer className="pt-8 border-t border-[#262626] text-xs text-[#767575] flex flex-wrap justify-between gap-3">
            <span>Runs locally in Next.js + Playwright Chromium</span>
            <span>No SaaS, no login, no uploads to third parties</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

