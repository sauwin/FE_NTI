import { test } from '@playwright/test'
import { applyMocks, setAuthState } from '../mocks'

const DELAY = 600

test('company pages tour', async ({ page }) => {
    await applyMocks(page)
    await page.goto('/')
    await setAuthState(page, 'company')

    const routes = [
        '/',
        '/dashboard',
        '/programs/b',
        '/programs/b/create-task',
    ]

    for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(DELAY)

        const burger = page.locator('[data-testid="mobile-menu-btn"]')
        if (await burger.isVisible()) {
            await burger.click()
            await page.waitForTimeout(DELAY)
            await burger.click()
            await page.waitForTimeout(DELAY)
        }
    }
})