// Captures the landing-page product screenshots from the real running app.
//
//   npm run dev                       # app must be up on :3000 / :4000
//   docker exec -i dentflow-postgres psql -U dentflow -d dentflow \
//     < backend/db/init/99e_showcase_seed.sql
//   node scripts/capture-screenshots.mjs
//
// Writes frontend/public/screenshots/<view>-<theme>.png in French, light + dark.
// The viewport is 16:10 to match the landing page's BrowserFrame, and generous
// enough (1760x1100) that tall pages like the month calendar aren't clipped.

import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'frontend/public/screenshots');
const BASE = 'http://localhost:3000';
const VIEWPORT = { width: 1760, height: 1100 };

// The showcase patient — seeded with vitals, treatments and a signed Rx.
const PATIENT = 'Yasmine Alaoui';

/** Fill one of the configurator's inputs — by its <label for>, else its placeholder. */
async function fillByLabel(page, label, placeholder, value) {
  const byLabel = page.getByLabel(label, { exact: false }).first();
  const input = (await byLabel.count()) ? byLabel : page.getByPlaceholder(placeholder).first();
  await input.fill(value);
}

// Every viewport is 16:10 (the BrowserFrame ratio) but sized per view, so a
// short page like the prescription editor fills its frame instead of leaving
// half of it empty, while the month calendar still gets the height it needs.
const VIEWS = [
  { name: 'dashboard', path: '/app/dashboard', viewport: { width: 1600, height: 1000 } },
  { name: 'calendar-month', path: '/app/calendar', viewport: { width: 1760, height: 1100 } },
  { name: 'invoices', path: '/app/invoices', viewport: { width: 1600, height: 1000 } },
  { name: 'stock', path: '/app/inventory', viewport: { width: 1600, height: 1000 } },

  {
    viewport: { width: 1440, height: 900 },
    // The patient record is an overlay opened from the directory — it has no
    // deep link, so we click through to it.
    name: 'patient-overview',
    path: '/app/patients',
    async drive(page) {
      await page.getByText(PATIENT, { exact: true }).first().click();
      await page.waitForTimeout(2500);
    },
  },

  {
    // Workflow step 01 "Book" — the new-appointment modal over the calendar.
    name: 'appointment-modal',
    path: '/app/calendar',
    viewport: { width: 1440, height: 900 },
    async drive(page) {
      await page.getByRole('button', { name: /nouveau rdv|new appointment/i }).first().click();
      await page.waitForTimeout(1500);
    },
  },

  {
    // Workflow step 02 "See" — the chart's vitals tab.
    name: 'patient-vitals',
    path: '/app/patients',
    viewport: { width: 1440, height: 900 },
    async drive(page) {
      await page.getByText(PATIENT, { exact: true }).first().click();
      await page.waitForTimeout(2000);
      await page.getByRole('tab', { name: /constantes/i }).or(
        page.getByText('Constantes', { exact: true }),
      ).first().click();
      await page.waitForTimeout(1500);
    },
  },

  {
    // Workflow step 04 "Bill" — the chart's billing tab.
    name: 'patient-billing',
    path: '/app/patients',
    viewport: { width: 1440, height: 900 },
    async drive(page) {
      await page.getByText(PATIENT, { exact: true }).first().click();
      await page.waitForTimeout(2000);
      await page.getByRole('tab', { name: /facturation/i }).or(
        page.getByText('Facturation', { exact: true }),
      ).first().click();
      await page.waitForTimeout(1500);
    },
  },

  {
    // The prescription editor opens empty; drive it to a realistic Rx in
    // progress — two drugs added, a third selected and configured.
    name: 'prescription-modal',
    path: '/app/prescriptions',
    viewport: { width: 1280, height: 800 },
    async drive(page) {
      const rx = [
        ['Amoxicilline', '500mg', '3x / jour', '7 jours'],
        ['Ibuprofène', '400mg', 'si douleur', '5 jours'],
        ['Paracétamol', '1g', '3x / jour max', '5 jours'],
      ];
      for (const [i, [drug, dose, freq, dur]] of rx.entries()) {
        await page.getByRole('button', { name: new RegExp(drug, 'i') }).first().click();
        await page.waitForTimeout(400);
        await fillByLabel(page, 'Dosage', '500mg', dose);
        await fillByLabel(page, 'Fréquence', '2x / day', freq);
        await fillByLabel(page, 'Durée', '5 days', dur);
        // Leave the last one configured but not yet added, so the middle
        // column shows a populated form rather than an empty state.
        if (i < rx.length - 1) {
          await page.getByRole('button', { name: /ajouter|add/i }).last().click();
          await page.waitForTimeout(400);
        }
      }
    },
  },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const inputs = page.locator('input');
  await inputs.nth(0).fill('demo');
  await inputs.nth(1).fill('demo');
  await page.locator('button[type=submit]').first().click();
  await page.waitForURL(/\/app\//, { timeout: 15000 });
}

async function capture(theme) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    // The landing page renders these ~700 CSS px wide inside the browser frame,
    // so a 1440–1760px-wide capture is already ~2x retina density. Shooting at
    // deviceScaleFactor 2 on top of that quadrupled the bytes for no visible
    // gain and tanked the landing page's LCP.
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Africa/Casablanca',
    colorScheme: theme,
    reducedMotion: 'reduce', // freeze entrance animations
  });
  const page = await ctx.newPage();

  await login(page);
  await page.evaluate(
    ([lang, t]) => {
      localStorage.setItem('medineeo_language', lang);
      localStorage.setItem('medineeo_theme', t);
    },
    ['fr', theme],
  );

  for (const view of VIEWS) {
    if (view.viewport) await page.setViewportSize(view.viewport);
    await page.goto(`${BASE}${view.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    if (view.drive) await view.drive(page);

    // Park the cursor off-canvas and drop focus: otherwise a hovered chart bar
    // leaves a tooltip and a hovered table row shows its action icons.
    await page.mouse.move(-50, -50);
    await page.evaluate(() => {
      document.activeElement?.blur?.();
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);

    await page.screenshot({ path: path.join(OUT, `${view.name}-${theme}.png`) });
    console.log(`  ✓ ${view.name}-${theme}.png`);
  }

  await browser.close();
}

for (const theme of ['light', 'dark']) {
  console.log(`\n${theme}:`);
  await capture(theme);
}
console.log(`\nWrote ${VIEWS.length * 2} screenshots to frontend/public/screenshots/`);
