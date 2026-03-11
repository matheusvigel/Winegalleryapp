/**
 * Dados mock para os testes — simula a base de dados Supabase.
 * IDs fixos permitem mocking consistente entre testes.
 */

export const REGION_ID = 'test-sg-001';
export const COUNTRY_ID = 'test-br-001';
export const COLLECTION_ID_1 = 'test-col-espumantes';
export const COLLECTION_ID_2 = 'test-col-tintos';

export const MOCK_REGION = {
  id: REGION_ID,
  name: 'Serra Gaúcha',
  country_id: COUNTRY_ID,
};

export const MOCK_COUNTRY = {
  id: COUNTRY_ID,
  name: 'Brasil',
  image_url: 'https://placehold.co/400x300/c5a96d/ffffff?text=Brasil',
  description: 'A principal região vinícola do Brasil.',
};

export const MOCK_COLLECTIONS = [
  {
    id: COLLECTION_ID_1,
    title: 'Espumantes Clássicos',
    description:
      'Os grandes espumantes da Serra Gaúcha, produzidos pelo método champenoise com uvas Chardonnay e Pinot Noir das melhores vinícolas da região.',
    level: 'essential',
    cover_image: 'https://placehold.co/390x600/3d5a7a/ffffff?text=Espumantes',
    total_points: 50,
  },
  {
    id: COLLECTION_ID_2,
    title: 'Tintos de Altitude',
    description:
      'Tintos produzidos em altitude com personalidade única. Terroir brasileiro com finesse e elegância europeia.',
    level: 'escape',
    cover_image: 'https://placehold.co/390x600/7a2e2e/ffffff?text=Tintos',
    total_points: 40,
  },
];

const WINES_COL1 = [
  {
    id: 'wine-001', name: 'Cave Geisse Rosé Brut',
    description: 'Cartão de visitas da Cave Geisse — estilo fino e elegante com custo-benefício exemplar.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/6b7c5a?text=Geisse+Rosé',
    points: 10, level: 'essential', wine_type: 'Espumante Rosé',
    elaboration_method: 'Champenoise', brands: { name: 'Família Geisse' },
  },
  {
    id: 'wine-002', name: 'Cave Geisse Nature',
    description: 'Referência da região no estilo nature — pureza e terroir sem intervenção.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/3d5a7a?text=Geisse+Nature',
    points: 10, level: 'essential', wine_type: 'Espumante Branco',
    elaboration_method: 'Champenoise', brands: { name: 'Família Geisse' },
  },
  {
    id: 'wine-003', name: 'Miolo Cuvée Giuseppe Brut',
    description: 'Representante do estilo brasileiro de espumante fino.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/8a4a2a?text=Miolo',
    points: 10, level: 'essential', wine_type: 'Espumante Branco',
    elaboration_method: 'Champenoise', brands: { name: 'Miolo' },
  },
  {
    id: 'wine-004', name: 'Chandon Brut',
    description: 'Clássico brasileiro com bollhas finas e frescor constante.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/2d6a4a?text=Chandon',
    points: 10, level: 'essential', wine_type: 'Espumante Branco',
    elaboration_method: 'Charmat', brands: { name: 'Chandon' },
  },
  {
    id: 'wine-005', name: 'Peterlongo Brut Reserva',
    description: 'Ícone da Serra Gaúcha com décadas de história.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/5a3a7a?text=Peterlongo',
    points: 10, level: 'essential', wine_type: 'Espumante Branco',
    elaboration_method: 'Charmat', brands: { name: 'Peterlongo' },
  },
];

const WINES_COL2 = [
  {
    id: 'wine-006', name: 'Pizzato Reserva Merlot',
    description: 'Tinto potente e elegante da Serra Gaúcha.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/7a2e2e?text=Pizzato',
    points: 10, level: 'escape', wine_type: 'Vinho Tinto',
    elaboration_method: 'Barrica', brands: { name: 'Pizzato' },
  },
  {
    id: 'wine-007', name: 'Aurora Millésime',
    description: 'Tinto de guarda premium com potencial de envelhecimento.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/4a1a1a?text=Aurora',
    points: 10, level: 'escape', wine_type: 'Vinho Tinto',
    elaboration_method: 'Barrica', brands: { name: 'Aurora' },
  },
  {
    id: 'wine-008', name: 'Don Guerino Alto Vento',
    description: 'Blend premium de altitude da Serra Gaúcha.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/3a0a0a?text=Don+Guerino',
    points: 10, level: 'escape', wine_type: 'Vinho Tinto',
    elaboration_method: 'Barrica', brands: { name: 'Don Guerino' },
  },
  {
    id: 'wine-009', name: 'Vallontano Grande Reserva',
    description: 'Alta altitude com terroir único e personalidade marcante.',
    type: 'wine',
    image_url: 'https://placehold.co/280x480/f5f0e8/5a1a0a?text=Vallontano',
    points: 10, level: 'escape', wine_type: 'Vinho Tinto',
    elaboration_method: 'Barrica', brands: { name: 'Vallontano' },
  },
];

export const MOCK_ALL_WINES = [...WINES_COL1, ...WINES_COL2];

export const MOCK_COLLECTION_ITEMS = [
  ...WINES_COL1.map(w => ({ collection_id: COLLECTION_ID_1, item_id: w.id })),
  ...WINES_COL2.map(w => ({ collection_id: COLLECTION_ID_2, item_id: w.id })),
];

export const MOCK_REGION_COLLECTIONS = [
  { collection_id: COLLECTION_ID_1, region_id: REGION_ID },
  { collection_id: COLLECTION_ID_2, region_id: REGION_ID },
];

export const MOCK_COUNTRIES = [
  {
    id: COUNTRY_ID,
    name: 'Brasil',
    image_url: 'https://placehold.co/400x300/c5a96d/ffffff?text=Brasil',
    description: 'A principal região vinícola do Brasil.',
  },
  {
    id: 'test-ar-001',
    name: 'Argentina',
    image_url: 'https://placehold.co/400x300/6b7c5a/ffffff?text=Argentina',
    description: 'Malbec e altitude.',
  },
  {
    id: 'test-fr-001',
    name: 'França',
    image_url: 'https://placehold.co/400x300/3d5a7a/ffffff?text=França',
    description: 'O berço do vinho.',
  },
];
