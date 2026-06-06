import { test } from '@playwright/test'
import { applyMocks, setAuthState } from '../mocks'

const DELAY = 600

test('student pages tour', async ({ page }) => {
    await applyMocks(page)
    await page.goto('/')
    await setAuthState(page, 'student')

    const routes = [
        '/',
        '/programs/a',
        '/programs/b',
        '/about',
        '/faq',
        '/partners',
        '/dashboard',
        '/profile',
        '/programs/a/upload',
    ]

    for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(DELAY)

// open mobile menu if hamburger visible
        const burger = page.locator('[data-testid="mobile-menu-btn"]')
        if (await burger.isVisible()) {
            await burger.click()
            await page.waitForTimeout(DELAY)
            await burger.click()
            await page.waitForTimeout(DELAY)
        }
    }
})