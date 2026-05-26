import { defineConfig, devices } from '@playwright/test'

export default defineConfig
(
    {
        testDir: './tests/e2e',
        projects: [{
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        }],
        use: {
            baseURL: /*process.env.BASE_URL ?? */'http://localhost:5173',
            headless: true,
            screenshot: 'only-on-failure',
            video: 'retain-on-failure',
        },
        webServer: {
            command: 'php artisan serve --port=8000',
            port: 8000,
            reuseExistingServer: true,
        }
    }
)