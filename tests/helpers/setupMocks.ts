import { Page } from '@playwright/test';
import {
  REGION_ID, COUNTRY_ID, COLLECTION_ID_1, COLLECTION_ID_2,
  MOCK_REGION, MOCK_COUNTRY, MOCK_COLLECTIONS, MOCK_REGION_COLLECTIONS,
  MOCK_ALL_WINES, MOCK_COLLECTION_ITEMS, MOCK_COUNTRIES,
} from './mockData';

/**
 * Intercepta chamadas de autenticação do Supabase.
 * Retorna estado "não autenticado" para rotas públicas funcionarem sem login.
 */
export async function mockAuth(page: Page) {
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/token') || url.includes('/user')) {
      return route.fulfill({
        status: 200,
        json: { user: null, session: null, access_token: null },
      });
    }
    return route.continue();
  });
}

/**
 * Intercepta todas as chamadas REST do Supabase e retorna dados mock.
 * Determina a tabela pelo pathname da URL e o tipo de retorno pelo header Accept.
 */
export async function mockRegionDetailAPI(page: Page) {
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const headers = route.request().headers();
    // .single() adiciona Accept: application/vnd.pgrst.object+json
    const isSingle = (headers['accept'] ?? '').includes('pgrst.object');
    const pathParts = url.pathname.split('/');
    const table = pathParts[pathParts.length - 1];
    const params = url.searchParams;

    let data: unknown;

    switch (table) {
      case 'regions': {
        const idEq = params.get('id');
        const parentIdEq = params.get('parent_id');
        if (idEq === `eq.${REGION_ID}`) {
          data = isSingle ? MOCK_REGION : [MOCK_REGION];
        } else if (parentIdEq === `eq.${REGION_ID}`) {
          data = []; // sem sub-regiões no mock
        } else {
          data = isSingle ? null : [];
        }
        break;
      }

      case 'countries': {
        const idEq = params.get('id');
        if (idEq === `eq.${COUNTRY_ID}`) {
          data = isSingle ? MOCK_COUNTRY : [MOCK_COUNTRY];
        } else {
          data = isSingle ? null : MOCK_COUNTRIES;
        }
        break;
      }

      case 'region_collections':
        data = MOCK_REGION_COLLECTIONS;
        break;

      case 'collections': {
        const idIn = params.get('id');
        if (idIn) {
          // Filtra coleções pelo id=in.(id1,id2)
          const ids = idIn.replace('in.(', '').replace(')', '').split(',');
          data = MOCK_COLLECTIONS.filter(c => ids.includes(c.id));
        } else {
          data = MOCK_COLLECTIONS;
        }
        break;
      }

      case 'collection_items': {
        const colIn = params.get('collection_id');
        if (colIn) {
          const ids = colIn.replace('in.(', '').replace(')', '').split(',');
          data = MOCK_COLLECTION_ITEMS.filter(ci => ids.includes(ci.collection_id));
        } else {
          data = MOCK_COLLECTION_ITEMS;
        }
        break;
      }

      case 'wine_items': {
        const idIn = params.get('id');
        if (idIn) {
          const ids = idIn.replace('in.(', '').replace(')', '').split(',');
          data = MOCK_ALL_WINES.filter(w => ids.includes(w.id));
        } else {
          data = MOCK_ALL_WINES;
        }
        break;
      }

      case 'highlights':
        data = [];
        break;

      default:
        data = isSingle ? null : [];
    }

    if (data === null) {
      return route.fulfill({
        status: 406,
        json: { code: 'PGRST116', details: null, hint: null, message: 'Not found' },
      });
    }

    return route.fulfill({ status: 200, json: data });
  });
}

/**
 * Mock completo para páginas gerais (Home, RegionsView).
 * Retorna dados mínimos para o app carregar sem erros.
 */
export async function mockGeneralAPI(page: Page) {
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const pathParts = url.pathname.split('/');
    const table = pathParts[pathParts.length - 1];

    const emptyResponses: Record<string, unknown> = {
      countries: MOCK_COUNTRIES,
      highlights: [],
      collections: [],
      regions: [],
      collection_items: [],
      wine_items: [],
    };

    const data = emptyResponses[table] ?? [];
    return route.fulfill({ status: 200, json: data });
  });
}
