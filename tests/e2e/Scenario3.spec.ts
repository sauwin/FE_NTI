import { test, expect } from '@playwright/test'
import { applyMocks, setAuthState } from './mocks'

const COMPANY_USER = {
    id: 2,
    name: 'Corp Owner',
    email: 'company@nti.test',
    role_slug: 'company',
    status: 'active',
    organization: { id: 1, name: 'Test Corp', role_in_org: 'owner' },
}

const STUDENT_USER = {
    id: 1,
    name: 'Test Student',
    email: 'student@nti.test',
    role_slug: 'student',
    status: 'active',
    organization: { role_in_org: null },
}

const TASK_WITH_CALL = {
    id: 1,
    title: 'NTI E2E Test Task',
    brief: 'Test task description for E2E.',
    budget: '3000',
    status: 'published',
    call_id: 1,
    call: {
        id: 1,
        program_type: 'b',
        status: 'active',
        deadline: '2099-12-31',
        deadline_at: '2099-12-31',
        required_documents: [
            { document_name: 'CV', is_mandatory: true, max_size_mb: 10 },
        ],
        task: null,
    },
    organization: { id: 1, name: 'Test Corp' },
}

function ok(body: unknown) {
    return { status: 200, contentType: 'application/json', body: JSON.stringify(body) }
}

test('Scenario 3: company creates task, student applies to Program B', async ({ page, context }) => {
// --- Company: set auth state and create task ---
    await applyMocks(page)
    await page.route('**/api/auth/me', r => r.fulfill(ok(COMPANY_USER)))
    await page.route('**/api/calls-with-tasks', r => r.fulfill(ok({ id: 1, status: 'published', task: TASK_WITH_CALL })))
    await page.route('**/api/programs', r => r.fulfill(ok([{ id: 1, type: 'a' }, { id: 2, type: 'b' }])))

    await page.goto('/')
    await setAuthState(page, 'company')
    await page.goto('/programs/b/create-task')
    await page.waitForSelector('input[placeholder*="AI Recruitment"]', { timeout: 15000 })

// Step 1
    await page.locator('input[placeholder*="AI Recruitment"]').fill('NTI E2E Test Task')
    await page.locator('textarea[placeholder*="Brief summary"]').fill('Test task description for E2E.')
    await page.locator('input[type="number"]').first().fill('3000')
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').first().fill(deadline)
    await page.locator('button[type="submit"]', { hasText: /Tech Specs/ }).click()

// Step 2
    await page.waitForSelector('textarea[placeholder*="problem"]', { timeout: 5000 })
    await page.locator('textarea[placeholder*="problem"]').fill('Automate student intake.')
    await page.locator('textarea[placeholder*="deliverables"]').fill('Working web app.')
    await page.locator('button[type="submit"]', { hasText: /Application Window/ }).click()

// Step 3
    await page.waitForSelector('input[type="date"]', { timeout: 5000 })
    const opensAt = new Date().toISOString().split('T')[0]
    const closesAt = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').nth(0).fill(opensAt)
    await page.locator('input[type="date"]').nth(1).fill(closesAt)
    await page.locator('button[type="submit"]', { hasText: /Document Rules/ }).click()

// Step 4
    await page.locator('button[type="submit"]', { hasText: /Final Uploads/ }).click()

// Step 5 — publish
    await page.waitForSelector('button:has-text("Publish Challenge")', { timeout: 5000 })
    await page.locator('button', { hasText: 'Publish Challenge' }).click()

    await expect(page.locator('text=/successfully submitted/i')).toBeVisible({ timeout: 10000 })

// --- Student: apply to Program B ---
    const studentPage = await context.newPage()
    await applyMocks(studentPage)
    await studentPage.route('**/api/auth/me', r => r.fulfill(ok(STUDENT_USER)))
    await studentPage.route('**/api/programs/b/tasks', r => r.fulfill(ok([TASK_WITH_CALL])))
    await studentPage.route('**/api/tasks/1', r => r.fulfill(ok(TASK_WITH_CALL)))
    await studentPage.route('**/api/calls/1', r => r.fulfill(ok(TASK_WITH_CALL.call)))
    await studentPage.route('**/api/profile/student', r => r.fulfill(ok({ id: 1, study_program: 'Applied Informatics', year_of_study: 1, university: 'UKF Nitra', academic_eligible: true })))
    await studentPage.route('**/api/teams', r => r.fulfill(ok([{ id: 1, name: 'E2E Team', status: 'active', leader_id: 1, members: [] }])))

    await studentPage.goto('/')
    await setAuthState(studentPage, 'student')

// Navigate to task listing, open task details, then apply
    await studentPage.goto('/programs/b')
    await studentPage.waitForSelector('button', { timeout: 10000 })
    await studentPage.locator('button', { hasText: /View|Detail|Open|See/ }).first().click()
    await studentPage.waitForURL(/programs\/b\/tasks\/\d+/, { timeout: 10000 })

    await studentPage.locator('button', { hasText: /Apply with team/ }).click()
    await studentPage.waitForURL(/programs\/b\/apply\/\d+/, { timeout: 10000 })

// Step 1 — pick team + describe solution
    const teamSelect = studentPage.locator('select').first()
    await studentPage.waitForSelector('select option', { state: 'attached', timeout: 10000 })
    await teamSelect.selectOption({ index: 0 })
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
    await expect(studentPage.locator('text=/Back to Catalog/i')).toBeVisible({ timeout: 10000 })
    await studentPage.close()
})