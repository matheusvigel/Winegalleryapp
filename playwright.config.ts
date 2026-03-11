import { defineConfig } from '@playwright/test';

/**
 * Configuração do Playwright para testes funcionais de layout.
 * Viewport: iPhone 14 (390x844) — representa o uso mobile principal do app.
 * Executa os testes contra o servidor de desenvolvimento local.
 *
 * Para rodar: npm test
 * Para ver relatório: npm run test:report
 * Para modo interativo: npm run test:ui
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    // Sempre captura screenshot — útil para revisão de layout
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Viewport mobile padrão (iPhone 14)
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1, // 1 para screenshots mais leves
  },
  projects: [
    {
      name: 'mobile-390',
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // reusa servidor já em execução
    timeout: 60_000,
  },
});
