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
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    // await expect(page.locator('table tbody tr')).not.toHaveCount(0, { timeout: 5000 })

// Pick first application row and open details
    const row = page.locator('table tbody tr').filter({ hasNot: page.locator('select[disabled]') }).first()
    const statusSelect = row.locator('select')
    await statusSelect.selectOption('approved')

    await expect(row.locator('span').filter({ hasText: /approved/i })).toBeVisible({ timeout: 8000 })

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