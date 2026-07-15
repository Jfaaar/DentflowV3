import { expect, test } from '@playwright/test';

test('app shell renders and the auth flow gate sends an unauthenticated user to /login', async ({ page }) => {
  await page.goto('/');
  // The router's RoleLanding sends an unauthenticated user to /login.
  await expect(page).toHaveURL(/\/login$/);
  // Either the login form fields are present, or at minimum the page loaded HTML.
  await expect(page.locator('html')).toBeVisible();
});

test('login page renders user + password inputs', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('demo / demo logs in and lands on /app/dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[autocomplete="username"]').fill('demo');
  await page.locator('input[type="password"]').fill('demo');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
});

test('unauthenticated visit to a protected app route is redirected to login', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/login(\?.*)?$/);
});
