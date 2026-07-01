import chromiumPack from '@sparticuz/chromium'
import { chromium as playwrightChromium } from 'playwright-core'

export async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL)

  if (isVercel) {
    chromiumPack.setGraphicsMode = false

    return playwrightChromium.launch({
      args: chromiumPack.args,
      executablePath: await chromiumPack.executablePath(),
      headless: true
    })
  }

  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}
