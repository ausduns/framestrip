import path from 'node:path'

export async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL)

  if (isVercel) {
    const chromiumPack = await import('@sparticuz/chromium')
    const { chromium } = await import('playwright-core')

    const executablePath = await chromiumPack.default.executablePath()
    process.env.LD_LIBRARY_PATH = path.dirname(executablePath)
    chromiumPack.default.setGraphicsMode = false

    return chromium.launch({
      args: chromiumPack.default.args,
      executablePath,
      headless: true
    })
  }

  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}
