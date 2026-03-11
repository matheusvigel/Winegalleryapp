import { test, expect } from '@playwright/test';
import { mockAuth, mockGeneralAPI, mockRegionDetailAPI } from './helpers/setupMocks';
import { REGION_ID, COUNTRY_ID } from './helpers/mockData';

/**
 * Testes de Fluxo Completo
 * Simula o percurso do usuário: Home → Regiões → Country → RegionDetail
 * Captura screenshots de cada tela para revisão visual de layout.
 */

test.describe('Fluxo: Home → Regiões → RegionDetail', () => {
  test('screenshot: home page', async ({ page }) => {
    await mockAuth(page);
    await mockGeneralAPI(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flow-01-home.png');
  });

  test('screenshot: página de regiões (/regions)', async ({ page }) => {
    await mockAuth(page);
    await mockGeneralAPI(page);
    await page.goto('/regions');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flow-02-regions.png');
  });

  test('screenshot: detalhe de país (/country/:id)', async ({ page }) => {
    await mockAuth(page);
    // Mock específico para country detail
    await page.route('**/rest/v1/**', async (route) => {
      const url = new URL(route.request().url());
      const table = url.pathname.split('/').pop()!;
      const params = url.searchParams;

      if (table === 'countries') {
        const idEq = params.get('id');
        const headers = route.request().headers();
        const isSingle = (headers['accept'] ?? '').includes('pgrst.object');
        return route.fulfill({
          status: 200,
          json: isSingle
            ? { id: COUNTRY_ID, name: 'Brasil', image_url: 'https://placehold.co/400x300/c5a96d/fff?text=Brasil', description: 'Vinhos brasileiros' }
            : [{ id: COUNTRY_ID, name: 'Brasil', image_url: 'https://placehold.co/400x300/c5a96d/fff?text=Brasil', description: 'Vinhos brasileiros' }],
        });
      }
      if (table === 'regions') {
        return route.fulfill({ status: 200, json: [
          { id: REGION_ID, name: 'Serra Gaúcha', country_id: COUNTRY_ID, parent_id: null, image_url: 'https://placehold.co/400x200/6b7c5a/fff?text=Serra+Gaúcha', description: 'Principal região vinícola' },
        ]});
      }
      if (table === 'collections') {
        return route.fulfill({ status: 200, json: [] });
      }
      return route.fulfill({ status: 200, json: [] });
    });

    await page.goto(`/country/${COUNTRY_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flow-03-country.png');
  });

  test('screenshot: region detail — cover slide', async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flow-04-region-cover.png');
  });

  test('screenshot: region detail — cards slide (1ª coleção)', async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('flow-05-region-cards-col1.png');
  });

  test('screenshot: region detail — cover slide da 2ª coleção', async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight * 2, behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('flow-06-region-cover-col2.png');
  });

  test('screenshot: region detail — cards slide da 2ª coleção', async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight * 3, behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('flow-07-region-cards-col2.png');
  });
});

test.describe('Fluxo: Vinícolas e Uvas', () => {
  test('screenshot: página de vinícolas (/brands)', async ({ page }) => {
    await mockAuth(page);
    await mockGeneralAPI(page);
    await page.goto('/brands');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flow-brands.png');
  });

  test('screenshot: página de uvas (/grapes)', async ({ page }) => {
    await mockAuth(page);
    await mockGeneralAPI(page);
    await page.goto('/grapes');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flow-grapes.png');
  });
});

test.describe('Verificações Gerais de Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockGeneralAPI(page);
  });

  test('viewport mobile: conteúdo não transborda horizontalmente', async ({ page }) => {
    const pages = ['/', '/regions', '/brands', '/grapes'];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow, `Overflow horizontal em ${path}`).toBe(false);
    }
  });

  test('região detail: sem overflow horizontal', async ({ page }) => {
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });

  test('todos os botões têm área de toque ≥ 36px', async ({ page }) => {
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');

    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      if (!(await btn.isVisible())) continue;
      const box = await btn.boundingBox();
      if (!box) continue;
      expect(box.width, `Botão ${i} muito estreito`).toBeGreaterThanOrEqual(36);
      expect(box.height, `Botão ${i} muito baixo`).toBeGreaterThanOrEqual(36);
    }
  });
});
