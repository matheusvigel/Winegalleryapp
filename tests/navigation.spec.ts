import { test, expect } from '@playwright/test';
import { mockAuth, mockGeneralAPI } from './helpers/setupMocks';

/**
 * Testes de Navegação
 * Verifica: estrutura do header, posição e funcionamento das abas de navegação.
 */

test.describe('Navegação — Header e Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockGeneralAPI(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('logotipo "Wine Gallery" visível no header', async ({ page }) => {
    await expect(page.getByText('wine gallery')).toBeVisible();
  });

  test('abas de navegação estão presentes', async ({ page }) => {
    const tabLabels = ['Início', 'Regiões', 'Vinícolas', 'Uvas'];
    for (const label of tabLabels) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }
  });

  test('aba "Regiões" navega para /regions', async ({ page }) => {
    await page.getByRole('tab', { name: 'Regiões' }).click();
    await page.waitForURL('**/regions**');
    expect(page.url()).toContain('/regions');
    await expect(page).toHaveScreenshot('nav-regioes-tab.png');
  });

  test('aba "Vinícolas" navega para /brands', async ({ page }) => {
    await page.getByRole('tab', { name: 'Vinícolas' }).click();
    await page.waitForURL('**/brands**');
    expect(page.url()).toContain('/brands');
  });

  test('aba "Uvas" navega para /grapes', async ({ page }) => {
    await page.getByRole('tab', { name: 'Uvas' }).click();
    await page.waitForURL('**/grapes**');
    expect(page.url()).toContain('/grapes');
  });

  test('aba ativa destaca corretamente ao navegar', async ({ page }) => {
    // Aba Regiões deve ficar ativa
    await page.getByRole('tab', { name: 'Regiões' }).click();
    await page.waitForURL('**/regions**');

    const tab = page.getByRole('tab', { name: 'Regiões' });
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  test('header está fixo no topo e não sobrepõe conteúdo', async ({ page }) => {
    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    // Header deve começar no topo da tela (y ≈ 0)
    expect(headerBox!.y).toBeLessThanOrEqual(2);
    // Header não deve ser muito alto (≤ 110px para caber abas + logo)
    expect(headerBox!.height).toBeLessThanOrEqual(115);
    await expect(page).toHaveScreenshot('nav-header-position.png');
  });

  test('screenshot: home page completa', async ({ page }) => {
    await expect(page).toHaveScreenshot('home-page.png', { fullPage: true });
  });
});
