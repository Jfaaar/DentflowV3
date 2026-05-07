import { expect, test } from '@playwright/test';

test('app shell renders and the auth flow gate sends an unauthenticated user to /login', async ({ page }) => {
  await page.goto('/');
  // The router's RoleLanding sends an unauthenticated user to /login.
  await expect(page).toHaveURL(/\/login$/);
  // Either the login form fields are present, or at minimum the page loaded HTML.
  await expect(page.locator('html')).toBeVisible();
});

test('login page contains the registration affordance', async ({ page }) => {
  await page.goto('/login');
  // Loose assertions — the legacy login page can change wording, but it
  // exposes some way to navigate to /register. Either a link or a button.
  const html = await page.content();
  expect(html.toLowerCase()).toContain('register');
});

test('unauthenticated visit to a protected app route is redirected to login', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/login(\?.*)?$/);
});
