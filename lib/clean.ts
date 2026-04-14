import * as cheerio from 'cheerio'

export interface CleanHtmlResult {
  html: string
  removed: {
    scripts: number
    links: number
    metas: number
    attributes: number
    badgesRemoved: number
  }
}

export function cleanHTML(inputHtml: string): CleanHtmlResult {
  const $ = cheerio.load(inputHtml)

  const removed = {
    scripts: 0,
    links: 0,
    metas: 0,
    attributes: 0,
    badgesRemoved: 0
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

  // Remove Framer commerce & branding overlays
  removed.badgesRemoved += removeFramerBadge($)
  removed.badgesRemoved += removeTemplatePurchaseLinks($)
  removed.badgesRemoved += removeFooterTemplateLinks($)
  removed.badgesRemoved += removeTemplateOverlays($)
  removed.badgesRemoved += stripBadgeCss($)

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

function removeFramerBadge($: cheerio.CheerioAPI) {
  let count = 0
  const badge = $('#framer-badge-container')
  if (!badge.length) return 0

  const parentChain: Array<ReturnType<typeof $>> = []
  let current = badge.parent()
  while (current.length && current[0]?.tagName?.toLowerCase() === 'div') {
    parentChain.push(current)
    current = current.parent()
  }

  badge.remove()
  count += 1

  for (const div of parentChain) {
    const hasElements = div.children().length > 0
    const hasText = (div.text() ?? '').trim().length > 0
    if (!hasElements && !hasText) {
      div.remove()
      count += 1
    }
  }

  return count
}

function removeTemplatePurchaseLinks($: cheerio.CheerioAPI) {
  let count = 0
  const selectors = [
    'a[href*="polar.sh"]',
    'a[href*="store.canvas.supply"]'
  ]

  $(selectors.join(',')).each((_, el) => {
    const link = $(el)
    if (!link.length) return

    const wrapper = link.closest('div')
    if (wrapper.length && isWrapperOnlyLink(wrapper, link)) {
      wrapper.remove()
      count += 1
      return
    }

    link.remove()
    count += 1
  })

  return count
}

function removeFooterTemplateLinks($: cheerio.CheerioAPI) {
  let count = 0

  const buyLinks = $('a')
    .filter((_, el) => normalizeText($(el).text()) === 'buy this template')
    .toArray()
  const madeLinks = $('a')
    .filter((_, el) => normalizeText($(el).text()) === 'made in framer')
    .toArray()

  const buySet = new Set(buyLinks)
  const madeSet = new Set(madeLinks)

  const handledParents = new Set<unknown>()

  for (const el of [...buyLinks, ...madeLinks]) {
    const link = $(el)
    const parent = link.parent()
    const tag = (parent[0]?.tagName ?? '').toLowerCase()
    if (tag !== 'div' && tag !== 'p') continue
    if (handledParents.has(parent[0])) continue

    const hasBuy = parent.find('a').toArray().some((a) => buySet.has(a))
    const hasMade = parent.find('a').toArray().some((a) => madeSet.has(a))

    if (hasBuy && hasMade) {
      parent.remove()
      handledParents.add(parent[0])
      count += 1
    }
  }

  for (const el of buyLinks) {
    const link = $(el)
    if (link.closest('div, p').length && handledParents.has(link.closest('div, p')[0])) continue
    if (link.parent().length && handledParents.has(link.parent()[0])) continue
    if (!link.closest('html').length) continue
    link.remove()
    count += 1
  }

  for (const el of madeLinks) {
    const link = $(el)
    if (link.closest('div, p').length && handledParents.has(link.closest('div, p')[0])) continue
    if (link.parent().length && handledParents.has(link.parent()[0])) continue
    if (!link.closest('html').length) continue
    link.remove()
    count += 1
  }

  return count
}

function removeTemplateOverlays($: cheerio.CheerioAPI) {
  let count = 0

  const templateOverlay = $('#template-overlay')
  if (templateOverlay.length) {
    templateOverlay.remove()
    count += 1
  }

  const overlay = $('#overlay')
  if (overlay.length) {
    const hasPurchaseLinks =
      overlay.find('a[href*="polar.sh"]').length > 0 ||
      overlay.find('a[href*="framer.com/store"]').length > 0 ||
      overlay.find('a[href*="canvas.supply"]').length > 0

    if (hasPurchaseLinks) {
      overlay.remove()
      count += 1
    }
  }

  return count
}

function stripBadgeCss($: cheerio.CheerioAPI) {
  let count = 0

  $('style').each((_, el) => {
    const style = $(el)
    const original = style.html() ?? style.text() ?? ''
    if (!original.trim()) return

    let updated = original
    const supportsRemoved = removeSupportsBlocksContaining({
      css: updated,
      needle: 'framer-badge'
    })
    updated = supportsRemoved.css

    const beforeRuleStrip = updated
    updated = updated.replace(
      /[^{}]*(?:\.framer-badge-container|#framer-badge-container)[^{]*\{[^}]*\}\s*/g,
      ''
    )

    const changed =
      supportsRemoved.removedCount > 0 || beforeRuleStrip !== updated

    if (!changed) return

    style.html(updated)
    count += supportsRemoved.removedCount > 0 ? supportsRemoved.removedCount : 1
  })

  return count
}

function removeSupportsBlocksContaining({
  css,
  needle
}: {
  css: string
  needle: string
}) {
  const lowerNeedle = needle.toLowerCase()
  let removedCount = 0

  let out = ''
  let i = 0

  while (i < css.length) {
    const next = css.indexOf('@supports', i)
    if (next === -1) {
      out += css.slice(i)
      break
    }

    out += css.slice(i, next)
    const blockStart = css.indexOf('{', next)
    if (blockStart === -1) {
      out += css.slice(next)
      break
    }

    const blockEnd = findMatchingBrace(css, blockStart)
    if (blockEnd === -1) {
      out += css.slice(next)
      break
    }

    const wholeBlock = css.slice(next, blockEnd + 1)
    if (wholeBlock.toLowerCase().includes(lowerNeedle)) {
      removedCount += 1
    } else {
      out += wholeBlock
    }

    i = blockEnd + 1
  }

  return { css: out, removedCount }
}

function findMatchingBrace(input: string, openIndex: number) {
  let depth = 0
  for (let i = openIndex; i < input.length; i += 1) {
    const ch = input[i]
    if (ch === '{') depth += 1
    if (ch === '}') depth -= 1
    if (depth === 0) return i
  }
  return -1
}

function isWrapperOnlyLink(
  wrapper: cheerio.Cheerio<any>,
  link: cheerio.Cheerio<any>
) {
  if (wrapper.children().length !== 1) return false
  const onlyChild = wrapper.children().first()
  if (!onlyChild.is('a')) return false

  const wrapperText = normalizeText(wrapper.text())
  const linkText = normalizeText(link.text())
  if (wrapperText !== linkText) return false

  const anchors = wrapper.find('a')
  if (anchors.length !== 1) return false

  return anchors.get(0) === link.get(0)
}

function normalizeText(input: string) {
  return (input ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

