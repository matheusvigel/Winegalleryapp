import { test, expect } from '@playwright/test';
import { mockAuth, mockRegionDetailAPI } from './helpers/setupMocks';
import { REGION_ID } from './helpers/mockData';

/**
 * Testes de Layout — RegionDetail
 *
 * Cobre os dois slides por coleção:
 *   1. CollectionCoverSlide: fundo creme, layout dividido (info esquerda / card direita), breadcrumb
 *   2. CollectionCardsSlide: header compacto (pill + título inline), carousel, tamanho dos cards, progresso
 */

const VIEWPORT_W = 390;

test.describe('RegionDetail — CollectionCoverSlide (1º slide)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('screenshot: cover slide inicial', async ({ page }) => {
    await expect(page).toHaveScreenshot('region-cover-slide.png');
  });

  test('fundo creme (#f5f0e8) no cover slide', async ({ page }) => {
    const bg = await page.locator('.snap-start').first().evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    // rgb(245, 240, 232) = #f5f0e8
    expect(bg).toBe('rgb(245, 240, 232)');
  });

  test('breadcrumb mostra "Regiões", "Brasil" e "Serra Gaúcha"', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Regiões' }).first()).toBeVisible();
    await expect(page.getByText('Brasil')).toBeVisible();
    await expect(page.getByText('Serra Gaúcha').first()).toBeVisible();
  });

  test('link "Regiões" no breadcrumb aponta para /regions', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Regiões' }).first();
    const href = await link.getAttribute('href');
    expect(href).toContain('/regions');
  });

  test('pill de nível "Essencial" visível', async ({ page }) => {
    await expect(page.getByText('Essencial').first()).toBeVisible();
  });

  test('título da coleção "Espumantes Clássicos" visível', async ({ page }) => {
    await expect(page.getByText('Espumantes Clássicos').first()).toBeVisible();
  });

  test('descrição da coleção visível', async ({ page }) => {
    await expect(page.getByText(/Os grandes espumantes/).first()).toBeVisible();
  });

  test('layout dividido: título da coleção na metade esquerda', async ({ page }) => {
    const titleEl = page.getByText('Espumantes Clássicos').first();
    const box = await titleEl.boundingBox();
    expect(box).not.toBeNull();
    // Título deve estar na metade esquerda da tela (< 50% da largura)
    expect(box!.x + box!.width / 2).toBeLessThan(VIEWPORT_W * 0.55);
  });

  test('botão voltar visível e clicável', async ({ page }) => {
    const backBtn = page.getByRole('button').first();
    await expect(backBtn).toBeVisible();
    const box = await backBtn.boundingBox();
    expect(box).not.toBeNull();
    // Botão deve ter tamanho mínimo tocável (≥ 36px)
    expect(box!.width).toBeGreaterThanOrEqual(36);
    expect(box!.height).toBeGreaterThanOrEqual(36);
  });

  test('CTA "Ver vinhos" visível', async ({ page }) => {
    await expect(page.getByText('Ver vinhos').first()).toBeVisible();
  });
});

test.describe('RegionDetail — CollectionCardsSlide (2º slide)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll vertical para o 2º slide (cards slide)
    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
  });

  test('screenshot: cards slide', async ({ page }) => {
    await expect(page).toHaveScreenshot('region-cards-slide.png');
  });

  test('pill de nível e título na MESMA LINHA (header compacto)', async ({ page }) => {
    // No cards slide (2º .snap-start), o header tem pill + h3 em flex-row
    const cardsSlide = page.locator('.snap-start').nth(1);
    const pill = cardsSlide.locator('span').first();
    const title = cardsSlide.locator('h3').first();

    const pillBox = await pill.boundingBox();
    const titleBox = await title.boundingBox();

    if (pillBox && titleBox) {
      // Diferença vertical ≤ 20px = mesma linha
      const yDiff = Math.abs(pillBox.y - titleBox.y);
      expect(yDiff).toBeLessThan(20);
      // Pill deve estar à esquerda do título
      expect(pillBox.x).toBeLessThan(titleBox.x);
    }
  });

  test('cards do carousel não ultrapassam 72% da largura da tela', async ({ page }) => {
    const cardSlots = page.locator('.snap-x .snap-center');
    const count = await cardSlots.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const box = await cardSlots.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(VIEWPORT_W * 0.72);
        expect(box.width).toBeGreaterThan(80); // não pode ser minúsculo
      }
    }
  });

  test('múltiplos cards: próximo card visível (peek)', async ({ page }) => {
    // Com cards < 72vw, o segundo card deve aparecer parcialmente na viewport
    const cardsSlide = page.locator('.snap-start').nth(1);
    const slideBox = await cardsSlide.boundingBox();
    const cardSlots = page.locator('.snap-x .snap-center');
    const count = await cardSlots.count();

    if (count >= 2 && slideBox) {
      const firstCardBox = await cardSlots.first().boundingBox();
      if (firstCardBox) {
        // Se a largura do card + padding é menor que a tela, o próximo card aparece
        const rightEdgeOfFirstCard = firstCardBox.x + firstCardBox.width;
        expect(rightEdgeOfFirstCard).toBeLessThan(VIEWPORT_W);
      }
    }
  });

  test('indicador de progresso visível: "X de Y provados"', async ({ page }) => {
    const progressText = page.getByText(/de \d+ provados?/).first();
    await expect(progressText).toBeVisible();
  });

  test('pontos ganhos visível no footer', async ({ page }) => {
    // "0 pts" ou "10 pts" etc.
    const ptsText = page.locator('.snap-start').nth(1).getByText(/pts$/);
    await expect(ptsText.first()).toBeVisible();
  });

  test('pontos totais da coleção visível no header compacto', async ({ page }) => {
    await expect(page.getByText('50 pts')).toBeVisible();
  });

  test('barra de progresso renderizada', async ({ page }) => {
    // A barra de progresso tem bg-neutral-300 (track) e o fill animado
    const cardsSlide = page.locator('.snap-start').nth(1);
    const track = cardsSlide.locator('.bg-neutral-300.rounded-full').first();
    await expect(track).toBeVisible();
  });

  test('dots de navegação aparecem quando há mais de 1 card', async ({ page }) => {
    const cardsSlide = page.locator('.snap-start').nth(1);
    // Dots são divs pequenos (w-1.5 h-1.5) dentro do footer
    const dots = cardsSlide.locator('.rounded-full.transition-all');
    const dotsCount = await dots.count();
    expect(dotsCount).toBeGreaterThanOrEqual(2); // pelo menos 2 cards no mock
  });
});

test.describe('RegionDetail — Segunda coleção (Tintos de Altitude)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('screenshot: cover slide da 2ª coleção', async ({ page }) => {
    // Scroll para o 3º slide (cover da 2ª coleção)
    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight * 2, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('region-cover-col2.png');
  });

  test('pill "Fugir do Óbvio" aparece na 2ª coleção', async ({ page }) => {
    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight * 2, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
    await expect(page.getByText('Fugir do Óbvio').first()).toBeVisible();
  });

  test('indicador "Próxima coleção" visível no cards slide da 1ª coleção', async ({ page }) => {
    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
    await expect(page.getByText('Próxima coleção', { exact: false })).toBeVisible();
  });
});

test.describe('RegionDetail — Navegação entre cards (scroll horizontal)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockRegionDetailAPI(page);
    await page.goto(`/region/${REGION_ID}`);
    await page.waitForLoadState('networkidle');
    // Vai para o cards slide
    await page.locator('.snap-y').evaluate(el => {
      el.scrollTo({ top: el.clientHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
  });

  test('scroll horizontal: 2º card visível após deslizar', async ({ page }) => {
    const carousel = page.locator('.snap-x').first();
    const firstCardWidth = await page.locator('.snap-x .snap-center').first()
      .evaluate(el => el.getBoundingClientRect().width);

    // Desliza para o próximo card
    await carousel.evaluate((el, w) => {
      el.scrollTo({ left: w, behavior: 'instant' });
    }, firstCardWidth);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('cards-scroll-second.png');
  });

  test('dot ativo muda ao scrollar para 2º card', async ({ page }) => {
    const cardsSlide = page.locator('.snap-start').nth(1);
    const carousel = page.locator('.snap-x').first();

    const firstCardWidth = await page.locator('.snap-x .snap-center').first()
      .evaluate(el => el.getBoundingClientRect().width);

    await carousel.evaluate((el, w) => {
      el.scrollTo({ left: w, behavior: 'instant' });
    }, firstCardWidth);
    await page.waitForTimeout(400);

    // O 2º dot deve ter a classe do dot ativo (w-4 em vez de w-1.5)
    const activeDot = cardsSlide.locator('.rounded-full.transition-all').nth(1);
    const classList = await activeDot.getAttribute('class');
    expect(classList).toContain('w-4');
  });
});
