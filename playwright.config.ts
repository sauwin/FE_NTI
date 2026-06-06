import { defineConfig, devices } from '@playwright/test'

const RESPONSIVE = process.env.RESPONSIVE === '1'

export default defineConfig({
    testDir: './tests/e2e',
    workers: RESPONSIVE ? 4 : 3,
    projects: RESPONSIVE ? [
        {
            name: 'mobile',
            use: { ...devices['iPhone 13'] },
            testMatch: '**/responsive/**',
        },
        {
            name: 'tablet',
            use: { ...devices['iPad (gen 7)'] },
            testMatch: '**/responsive/**',
        },
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/responsive/**',
        },
    ] : [
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testIgnore: '**/responsive/**',
        },
    ],
    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        screenshot: 'only-on-failure',
        video: RESPONSIVE ? 'on' : 'retain-on-failure',
    },
    webServer: {
        command: 'npm run build && npm run preview -- --port 5173',
        port: 5173,
        reuseExistingServer: !process.env.CI,
    },
})