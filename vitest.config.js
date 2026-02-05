import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Exclude E2E tests (those are run by Playwright)
        exclude: [
            'tests/e2e/**',
            '**/node_modules/**',
            '**/dist/**'
        ],
        // Include test files matching these patterns
        include: ['tests/**/*.test.js'],
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['js/**/*.js', 'app.js'],
            exclude: [
                'node_modules/**',
                'tests/**',
                'assets/**'
            ]
        }
    }
});
