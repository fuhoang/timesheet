import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'user@test.com';
const password = process.env.E2E_PASSWORD || 'password';

test('login and start/stop timer', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

    const projectSelect = page.locator('select');
    await expect(projectSelect).toBeVisible();

    const startButton = page.getByRole('button', { name: 'Start' });
    const stopButton = page.getByRole('button', { name: 'Stop' });

    // Ensure we are in a known state before asserting start->stop flow.
    if (await stopButton.isVisible()) {
        await stopButton.click();
        await expect(startButton).toBeVisible();
    }

    await expect(startButton).toBeEnabled();
    await startButton.click();
    await expect(stopButton).toBeVisible();

    await stopButton.click();
    await expect(startButton).toBeVisible();
});
