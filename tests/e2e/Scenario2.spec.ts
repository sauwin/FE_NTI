import { test, expect } from '@playwright/test'
import { ADMIN, loginAs } from './helpers'
import { applyMocks } from './mocks'

// Prerequisite: at least one submitted application and one mentor account exist in DB

test('Scenario 2: admin approves application and assigns mentor', async ({ page }) => {
    await applyMocks(page)
    await loginAs(page, ADMIN.email, ADMIN.password)
    await page.waitForURL(/dashboard/)

// --- Change application status to approved ---
    await page.locator('button', { hasText: 'Applications' }).click()
    await page.waitForSelector('table tbody tr, [data-role="application-row"]')

// Pick first application row and open details
    await page.locator('button', { hasText: /View|Details/ }).first().click()
    await page.waitForURL(/applications\/\d+/)

// Approve: admin status change select or button
    const statusSelect = page.locator('select[name="status"], select').filter({ hasText: /draft|pending|submitted/ }).first()
    if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('approved')
    } else {
        await page.locator('button', { hasText: /Approve/ }).first().click()
    }

    await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 8000 })

// --- Back to dashboard, open Mentors tab ---
    await page.goto('/dashboard')
    await page.locator('button', { hasText: 'Mentors' }).click()
    await page.waitForSelector('select')

// Select application
    const appSelect = page.locator('select').first()
    await appSelect.selectOption({ index: 1 })

// Select mentor user
    const mentorSelect = page.locator('select').nth(1)
    await mentorSelect.selectOption({ index: 1 })

    await page.locator('button', { hasText: /Assign/ }).click()

    await expect(page.locator('text=/assigned|success/i')).toBeVisible({ timeout: 8000 })
})