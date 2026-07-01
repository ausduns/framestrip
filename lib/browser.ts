import chromiumPack from '@sparticuz/chromium'
import { chromium as playwrightChromium } from 'playwright-core'

export async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL)

  if (isVercel) {
    chromiumPack.setGraphicsMode = false

    const executablePath = await chromiumPack.executablePath()
    const libPath = '/tmp/al2023/lib'
    if (!process.env.LD_LIBRARY_PATH?.split(':').includes(libPath)) {
      process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
        ? `${libPath}:${process.env.LD_LIBRARY_PATH}`
        : libPath
    }

    return playwrightChromium.launch({
      args: chromiumPack.args,
      executablePath,
      headless: true
    })
  }

  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}
