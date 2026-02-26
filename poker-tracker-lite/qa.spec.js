const { test, expect } = require('@playwright/test');

const baseURL = 'http://127.0.0.1:4173';

test('qa regression with Chart.js blocked (fallback mode)', async ({ page }) => {
  await page.route('**/cdn.jsdelivr.net/npm/chart.js', route => route.abort());
  await page.goto(baseURL);

  await expect(page.locator('#chartsStatus')).toContainText('Charts unavailable right now');

  await page.fill('#date', '2026-02-20');
  await page.selectOption('#sessionType', 'cash');
  await page.click('#advancedFields summary');
  await page.fill('#location', 'Room A');
  await page.fill('#stake', '1/2');
  await page.fill('#buyIn', '100');
  await page.fill('#cashOut', '150');
  await page.fill('#notes', 'n1');
  await page.click('#saveBtn');

  await expect(page.locator('.session-item')).toHaveCount(1);
  await expect(page.locator('#summaryAll')).toContainText('1 sessions');

  await page.click('.edit-btn');
  await page.fill('#cashOut', '180');
  await page.click('#saveBtn');
  await expect(page.locator('.session-item .profit-pos')).toContainText('$80.00');

  await page.click('#advancedFields summary');
  await page.fill('#date', '2026-02-21');
  await page.selectOption('#sessionType', 'tournament');
  await page.fill('#location', 'Room B');
  await page.fill('#stake', 'MTT');
  await page.fill('#buyIn', '50');
  await page.fill('#cashOut', '20');
  await page.click('#saveBtn');

  await page.click('button[data-type="cash"]');
  await expect(page.locator('.session-item')).toHaveCount(1);

  await page.reload();
  await page.click('button[data-type="all"]');
  await expect(page.locator('.session-item')).toHaveCount(2);

  const selectors = ['#saveBtn','.chip','.edit-btn','.delete-btn','.advanced-fields summary'];
  for (const sel of selectors) {
    const heights = await page.locator(sel).evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().height)));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  }
});

test('quick smoke with Chart.js available', async ({ page }) => {
  await page.goto(baseURL);
  await expect(page.locator('#sessionForm')).toBeVisible();
  await expect(page.locator('#summaryAll')).toContainText('sessions');
  await expect(page.locator('#history')).toBeVisible();
});
