import { Page } from '@playwright/test'

export const STUDENT = {
firstName: 'Test',
lastName: 'Student',
email: `student+${Date.now()}@nti.test`,
password: 'Password123!',
}

export const ADMIN = {
email: process.env.ADMIN_EMAIL ?? 'admin@nti.test',
password: process.env.ADMIN_PASSWORD ?? 'AdminPass123!',
}

export const COMPANY = {
firstName: 'Corp',
lastName: 'Owner',
email: `company+${Date.now()}@nti.test`,
password: 'Password123!',
}

export async function loginAs(page: Page, email: string, password: string) {
await page.goto('/auth/login')
await page.locator('input[type="email"]').fill(email)
await page.locator('input[type="password"]').fill(password)
await page.locator('button[type="submit"]').click()
await page.waitForURL(/dashboard|pending/)
}