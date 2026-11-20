import { devices, expect, test, type Page } from '@playwright/test'

// iPhone 13 emulation without forcing a new browser type (allowed inside describe blocks).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { defaultBrowserType: _ignored, ...iPhone } = devices['iPhone 13']

const ROUTES = ['/', '/erga', '/erga/lefkos-ogkos', '/ypiresies', '/sxetika', '/aitima-prosforas', '/politiki-aporritou']

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}
const overlay = (page: Page) =>
  page.evaluate(() => ({
    menu: getComputedStyle(document.getElementById('mobile-menu')!).visibility,
    curtain: getComputedStyle(document.querySelector('[class*="z-[60]"]')!).visibility,
    lock: document.documentElement.style.overflow,
  }))

test.describe('prerendered pages', () => {
  for (const route of ROUTES) {
    test(`${route}: static HTML, SEO tags, clean hydration`, async ({ page, request }) => {
      const html = await (await request.get(route)).text()
      expect(html).toContain('data-prerendered')
      expect(html).toMatch(/<h1[^>]*>/)
      expect(html).toMatch(/<link rel="canonical" href="[^"]+">/)
      expect(html).toMatch(/<meta property="og:image" content="https?:\/\//)
      const errors = trackErrors(page)
      await page.goto(route, { waitUntil: 'networkidle' })
      const hydration = await page.evaluate(() => (window as unknown as { __hydrationErrors?: string[] }).__hydrationErrors ?? [])
      expect(hydration, 'hydration mismatches').toEqual([])
      expect(errors).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }

  test('sitemap, robots and structured data', async ({ request, page }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('/erga/lefkos-ogkos</loc>')
    expect(await (await request.get('/robots.txt')).text()).toMatch(/Disallow: \/diaxeirisi[\s\S]*Sitemap: /)
    await page.goto('/erga/lefkos-ogkos')
    const types = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent!)['@type']))
    expect(types).toEqual(expect.arrayContaining(['CreativeWork', 'BreadcrumbList']))
  })

  test('unknown pages fall back to the app and show a Greek 404', async ({ page }) => {
    await page.goto('/den-yparxei')
    await expect(page.locator('h1')).toContainText('δεν βρέθηκε')
  })
})

test.describe('home', () => {
  test('cinematic hero and the single pinned 3D gallery activate on desktop', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('#arxi')).toHaveClass(/is-cinematic/)
    await expect(page.locator('#erga')).toHaveClass(/is-3d/)
    expect(await page.locator('.pin-spacer').count()).toBe(1)
    await expect(page.locator('[data-g-item] h3')).toHaveCount(5)
  })

  test('section link scrolls smoothly and marks the active item', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('nav[aria-label="Κύρια πλοήγηση"] a[href="/#filosofia"]').click()
    await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('filosofia')!.getBoundingClientRect().top))).toBeLessThan(120)
    await expect(page.locator('nav[aria-label="Κύρια πλοήγηση"] a[href="/#filosofia"]')).toHaveAttribute('aria-current', 'location')
  })

  test('page transitions never leave an overlay behind', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    for (const href of ['/erga', '/ypiresies', '/sxetika', '/aitima-prosforas', '/']) {
      await page.locator(`nav[aria-label="Κύρια πλοήγηση"] a[href="${href}"], header a[href="${href}"]`).first().click()
      await page.waitForTimeout(120)
    }
    await page.waitForTimeout(1500)
    expect(await overlay(page)).toEqual({ menu: 'hidden', curtain: 'hidden', lock: '' })
  })

  test('reduced motion: no pin, no 3D, content complete', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
    await expect(page.locator('#erga')).not.toHaveClass(/is-3d/)
    expect(await page.locator('.pin-spacer').count()).toBe(0)
    await expect(page.locator('[data-g-item] h3').first()).toBeVisible()
    await ctx.close()
  })
})

test.describe('mobile', () => {
  test.use(iPhone)
  test('hero intro plays on the first, prerendered load and ends in its final state', async ({ page }) => {
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute('data-hero-intro'))).toBe(false)
    await expect
      .poll(() => page.$$eval('[data-hero-line]', (els) => els.every((e) => getComputedStyle(e).transform === 'matrix(1, 0, 0, 1, 0, 0)')), { timeout: 8000 })
      .toBe(true)
    await expect(page.locator('#hero-title')).toBeVisible()
  })

  test('menu: opens, traps focus, Escape closes, links navigate and close', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const toggle = page.locator('button[aria-controls="mobile-menu"]')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect.poll(() => page.evaluate(() => document.getElementById('mobile-menu')!.contains(document.activeElement))).toBe(true)
    // Regression: labels on a prerendered page must slide fully into view (not stay offset below their masks).
    await expect
      .poll(() => page.$$eval('[data-menu-line]', (els) => els.every((e) => getComputedStyle(e).transform === 'matrix(1, 0, 0, 1, 0, 0)')))
      .toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => overlay(page)).toEqual({ menu: 'hidden', curtain: 'hidden', lock: '' })
    await expect(toggle).toBeFocused()
    await toggle.click()
    await page.locator('#mobile-menu a[href="/ypiresies"]').click()
    await expect(page).toHaveURL(/\/ypiresies$/)
    await expect.poll(() => overlay(page)).toEqual({ menu: 'hidden', curtain: 'hidden', lock: '' })
  })
  test('gallery is a simple list on phones', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('#erga')).not.toHaveClass(/is-3d/)
  })
})

test.describe('projects', () => {
  test('filters update the URL, count and results without jumping to top', async ({ page }) => {
    await page.goto('/erga', { waitUntil: 'networkidle' })
    await expect(page.locator('article[aria-labelledby^="card-"]')).toHaveCount(8)
    await page.getByRole('button', { name: /Επαγγελματικοί χώροι/ }).click()
    await expect(page).toHaveURL(/katigoria=epaggelmatikoi-xoroi/)
    await expect(page.locator('article[aria-labelledby^="card-"]')).toHaveCount(2)
    await expect(page.getByRole('button', { name: /Επαγγελματικοί χώροι/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[aria-live="polite"]').first()).toContainText('2 έργα')
  })

  test('detail: lightbox keyboard support and next project', async ({ page }) => {
    await page.goto('/erga/anakainisi-diamerismatos', { waitUntil: 'networkidle' })
    await page.locator('button[aria-label^="Μεγέθυνση"]').first().click()
    await expect(page.locator('dialog[open]')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('dialog [aria-live]')).toContainText('02')
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page.locator('button[aria-label^="Μεγέθυνση"]').first()).toBeFocused()
    await page.locator('[data-next] a[href^="/erga/"]').click()
    await expect(page.locator('h1')).toHaveText('Οικία κάτω από τα Δέντρα')
  })
})

test.describe('quote request (no backend in this build)', () => {
  test('error summary, inline validation and honest result', async ({ page }) => {
    await page.goto('/aitima-prosforas', { waitUntil: 'networkidle' })
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('#q-summary-title')).toContainText('7')
    await expect(page.locator('[role="alert"]')).toBeFocused()
    await page.fill('#q-email', 'λάθος')
    await page.locator('#q-email').blur()
    await expect(page.locator('#q-email-error')).toContainText('δεν φαίνεται σωστό')
    await page.fill('#q-fullname', 'Δοκιμή Χρήστη')
    await page.fill('#q-email', 'test@example.gr')
    await page.fill('#q-phone', '6900000000')
    await page.fill('#q-area', 'Αθήνα')
    await page.check('#q-type-1', { force: true })
    await page.fill('#q-description', 'Ανακαίνιση διαμερίσματος με νέα κουζίνα και μπάνιο.')
    await page.check('#q-privacy')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('[role="status"]').last()).toContainText('δεν στάλθηκε')
    await expect(page.locator('#q-fullname')).toHaveValue('Δοκιμή Χρήστη')
  })
})
