# Framestrip (Next.js + Playwright Extractor)

## Install & run

```bash
npm install
npx playwright install chromium
npm run dev
```

Open the dev server URL printed in your terminal.

## What it does

- **UI**: paste a URL or upload an `.html` file
- **API**: `POST /api/extract` renders with Playwright, strips common Framer/Webflow/runtime/analytics bloat, then returns a **downloadable ZIP**

