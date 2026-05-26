import { test, expect, Page } from '@playwright/test'
import { COMPANY, STUDENT, loginAs } from './helpers'
import {applyMocks, applyMocksToContext} from "./mocks";

async function registerCompany(page: Page) {
    await page.goto('/auth/register')
    await page.locator('input[placeholder="John"]').fill(COMPANY.firstName)
    await page.locator('input[placeholder="Pork"]').fill(COMPANY.lastName)
    await page.locator('input[type="email"]').fill(COMPANY.email)
    await page.locator('input[type="password"]').first().fill(COMPANY.password)
    await page.locator('input[type="password"]').nth(1).fill(COMPANY.password)

    const roleSelect = page.locator('select').first()
    await roleSelect.selectOption('company')

    await page.locator('#terms').check()
    await page.locator('#gdpr').check()
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/pending/)
// simulate verification
//     await page.goto('/verified')
    await page.goto('/dashboard')
}

test('Scenario 3: company creates task, student applies to Program B', async ({ page, context }) => {
    await applyMocks(page)
    await applyMocksToContext(context)
// --- Company creates task ---
    await registerCompany(page)
    await page.goto('/programs/b/create-task')

// Step 1 — basic info
    await page.locator('input[placeholder*="AI Recruitment"]').fill('NTI E2E Test Task')
    await page.locator('textarea[placeholder*="Brief summary"]').fill('Test task description for E2E.')
    await page.locator('input[type="number"]').first().fill('3000')

    const today = new Date()
    today.setMonth(today.getMonth() + 3)
    const deadline = today.toISOString().split('T')[0]
    await page.locator('input[type="date"]').first().fill(deadline)

    await page.locator('button', { hasText: 'Continue to Tech Specs' }).click()

// Step 2 — tech specs
    await page.locator('textarea[placeholder*="problem"]').fill('Automate student intake.')
    await page.locator('textarea[placeholder*="deliverables"]').fill('Working web app.')
    await page.locator('button', { hasText: 'Continue to Application Window' }).click()

// Step 3 — call window
    const opensAt = new Date().toISOString().split('T')[0]
    const closesAt = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').nth(0).fill(opensAt)
    await page.locator('input[type="date"]').nth(1).fill(closesAt)
    await page.locator('button', { hasText: 'Continue to Document Rules' }).click()

// Step 4 — document rules (skip adding extra docs)
    await page.locator('button', { hasText: 'Continue to Final Uploads' }).click()

// Step 5 — submit
    await page.locator('button', { hasText: /Publish|Submit/ }).first().click()

    await expect(page.locator('text=/submitted|success/i')).toBeVisible({ timeout: 10000 })

// --- Student applies to Program B ---
// Open new page as student (re-use existing student creds from scenario 1 or use env vars)
    const studentEmail = process.env.STUDENT_EMAIL ?? STUDENT.email
    const studentPassword = process.env.STUDENT_PASSWORD ?? STUDENT.password

    const studentPage = await context.newPage()
    await loginAs(studentPage, studentEmail, studentPassword)

// Navigate to Program B listing and pick first available task
    await studentPage.goto('/programs/b')
    await studentPage.locator('a[href*="/programs/b/apply/"], button', { hasText: /Apply/ }).first().click()
    await studentPage.waitForURL(/programs\/b\/apply\/\d+/)

// Step 1 — team + solution
    const teamSelect = studentPage.locator('select').first()
    await teamSelect.selectOption({ index: 1 })

    await studentPage.locator('input[type="text"]').first().fill('Our E2E Solution Title')
    await studentPage.locator('textarea[placeholder*="Describe"]').fill('We will build it with Vue and Laravel.')
    await studentPage.locator('button', { hasText: /Next|Continue/ }).first().click()

// Step 2 — upload documents
    const fileInputs = studentPage.locator('input[type="file"]')
    const count = await fileInputs.count()
    for (let i = 0; i < count; i++) {
        await fileInputs.nth(i).setInputFiles({
            name: `doc_${i}.pdf`,
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 test'),
        })
    }

    await studentPage.locator('button', { hasText: /Submit/ }).click()

    await expect(studentPage.locator('text=/submitted|success|Back to Catalog/i')).toBeVisible({ timeout: 10000 })
    await studentPage.close()
})