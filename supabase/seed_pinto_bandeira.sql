-- ============================================================
-- Seed: Pinto Bandeira — Serra Gaúcha — Brasil
-- Execute AFTER schema.sql AND add_wine_type_fields.sql
-- Source: Curadoria - Coleções e itens - Pinto Bandeira - Serra Gaúcha - Brasil.csv
-- ============================================================

-- ============================================================
-- COUNTRY
-- ============================================================

INSERT INTO countries (id, name, image_url, description) VALUES
  ('brasil', 'Brasil', '', 'Terra dos espumantes sul-rio-grandenses e vinhos de altitude da Serra Gaúcha')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- REGIONS
-- ============================================================

INSERT INTO regions (id, name, country_id, parent_id, image_url, description) VALUES
  ('serra-gaucha', 'Serra Gaúcha', 'brasil', NULL, '', 'Principal região vinícola do Brasil, com altitude e clima úmido favoráveis à viticultura'),
  ('pinto-bandeira', 'Pinto Bandeira', 'brasil', 'serra-gaucha', '', 'Denominação de Origem reconhecida dentro da Serra Gaúcha, referência em espumantes Champenoise e vinhos de altitude')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BRANDS (Vinícolas)
-- ============================================================

INSERT INTO brands (id, name, description, image_url, country, region) VALUES
  ('familia-geisse',   'Família Geisse',      'Pioneira em espumantes Champenoise no Brasil, com sede em Pinto Bandeira', '', 'Brasil', 'Pinto Bandeira'),
  ('don-giovanni',     'Vinícola Don Giovanni','Produtora de Pinto Bandeira com portfólio diversificado em espumantes e vinhos tranquilos', '', 'Brasil', 'Pinto Bandeira'),
  ('vinicola-aurora',  'Vinícola Aurora',      'Uma das maiores cooperativas vinícolas do Brasil, com expressiva linha de espumantes', '', 'Brasil', 'Serra Gaúcha'),
  ('vita-eterna',      'Vinícola Vita Eterna', 'Produtora de Pinto Bandeira com destaque para espumantes de safra e vinificações inovadoras', '', 'Brasil', 'Pinto Bandeira'),
  ('vinicola-tercas',  'Vinícola Terraças',    'Produtora menor de Pinto Bandeira com espumantes rosé de alta performance', '', 'Brasil', 'Pinto Bandeira'),
  ('valmarino',        'Vinícola Valmarino',   'Referência em tintos e espumantes de altitude em Pinto Bandeira, com destaque para Cabernet Franc', '', 'Brasil', 'Pinto Bandeira')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GRAPES (nova uva)
-- ============================================================

INSERT INTO grapes (id, name, description, image_url, type, characteristics) VALUES
  ('cabernet-franc', 'Cabernet Franc', 'Uva tinta aromática, ancestral do Cabernet Sauvignon', '', 'red', 'Corpo médio, taninos elegantes, notas de pimentão, violeta e frutas vermelhas')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COLLECTIONS
-- ============================================================

INSERT INTO collections (id, title, description, level, cover_image, total_points) VALUES
  ('pinto-bandeira-essencial',
   'Vinhos e espumantes essenciais de Pinto Bandeira na Serra Gaúcha',
   'Os rótulos fundamentais para entender a identidade vinícola de Pinto Bandeira — do espumante Champenoise ao vinho tranquilo.',
   'essential', '', 0),
  ('pinto-bandeira-fora-do-obvio',
   'Vinhos e espumantes para fugir do óbvio em Pinto Bandeira, na Serra Gaúcha',
   'Rótulos que surpreendem, provocam e saem do circuito habitual — da maceração ao Orange de Noir.',
   'escape', '', 0),
  ('pinto-bandeira-icone',
   'Vinhos e espumantes ícones de Pinto Bandeira, na Serra Gaúcha',
   'O mais alto nível da produção de Pinto Bandeira — espumantes de autólise prolongada e tintos de expressão internacional.',
   'icon', '', 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- REGION ↔ COLLECTIONS
-- ============================================================

INSERT INTO region_collections (region_id, collection_id) VALUES
  ('pinto-bandeira', 'pinto-bandeira-essencial'),
  ('pinto-bandeira', 'pinto-bandeira-fora-do-obvio'),
  ('pinto-bandeira', 'pinto-bandeira-icone')
ON CONFLICT DO NOTHING;

-- ============================================================
-- BRAND ↔ COLLECTIONS
-- ============================================================

INSERT INTO brand_collections (brand_id, collection_id) VALUES
  -- Essencial
  ('familia-geisse',  'pinto-bandeira-essencial'),
  ('don-giovanni',    'pinto-bandeira-essencial'),
  ('vinicola-aurora', 'pinto-bandeira-essencial'),
  ('vita-eterna',     'pinto-bandeira-essencial'),
  -- Fora do Óbvio
  ('vita-eterna',     'pinto-bandeira-fora-do-obvio'),
  ('vinicola-tercas', 'pinto-bandeira-fora-do-obvio'),
  ('valmarino',       'pinto-bandeira-fora-do-obvio'),
  ('don-giovanni',    'pinto-bandeira-fora-do-obvio'),
  ('familia-geisse',  'pinto-bandeira-fora-do-obvio'),
  -- Ícone
  ('familia-geisse',  'pinto-bandeira-icone'),
  ('don-giovanni',    'pinto-bandeira-icone'),
  ('valmarino',       'pinto-bandeira-icone')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GRAPE ↔ COLLECTIONS
-- ============================================================

INSERT INTO grape_collections (grape_id, collection_id) VALUES
  ('pinot-noir',      'pinto-bandeira-essencial'),
  ('chardonnay',      'pinto-bandeira-essencial'),
  ('pinot-noir',      'pinto-bandeira-fora-do-obvio'),
  ('chardonnay',      'pinto-bandeira-fora-do-obvio'),
  ('cabernet-franc',  'pinto-bandeira-fora-do-obvio'),
  ('pinot-noir',      'pinto-bandeira-icone'),
  ('chardonnay',      'pinto-bandeira-icone'),
  ('cabernet-franc',  'pinto-bandeira-icone')
ON CONFLICT DO NOTHING;

-- ============================================================
-- WINE ITEMS
-- ============================================================

-- Coleção: Essencial
INSERT INTO wine_items (id, name, description, type, image_url, level, brand_id, wine_type, elaboration_method) VALUES
  ('cave-geisse-rose-brut',
   'Cave Geisse Rosé Brut',
   'Cartão de visitas da Cave Geisse — introduz o estilo fino e elegante da vinícola com custo-benefício exemplar.',
   'wine', '', 'essential', 'familia-geisse',
   'Espumante Rosé', 'Champenoise'),

  ('cave-geisse-nature',
   'Cave Geisse Nature',
   'Referência da região no estilo Nature — pureza e terroir sem intervenção de açúcar.',
   'wine', '', 'essential', 'familia-geisse',
   'Espumante Branco', 'Champenoise'),

  ('don-giovanni-rose-pinot-noir-2022',
   'Don Giovanni Rosé Pinot Noir 2022',
   'Mostra que Pinto Bandeira vai além do espumante — um rosé tranquilo de alta qualidade com identidade clara de terroir.',
   'wine', '', 'essential', 'don-giovanni',
   'Vinho Rosé Tranquilo', NULL),

  ('espumante-aurora-pinto-bandeira-36-meses',
   'Espumante Aurora Pinto Bandeira Extra Brut 36 Meses',
   'Representa a expressão de grande cooperativa com qualidade de nível superior — 36 meses de autólise a preço acessível.',
   'wine', '', 'essential', 'vinicola-aurora',
   'Espumante Branco', 'Champenoise'),

  ('espumante-vita-eterna-nature-2020',
   'Espumante Vita Eterna Nature 2020',
   'Espumante de safra definida que evidencia o potencial enológico da Vita Eterna e do terroir de Pinto Bandeira.',
   'wine', '', 'essential', 'vita-eterna',
   'Espumante Branco', 'Champenoise')

ON CONFLICT (id) DO NOTHING;

-- Coleção: Fora do Óbvio
INSERT INTO wine_items (id, name, description, type, image_url, level, brand_id, wine_type, elaboration_method) VALUES
  ('vita-eterna-orange-de-noir',
   'Vita Eterna Orange de Noir',
   'Rompe com a lógica tradicional dos espumantes de Pinto Bandeira — um Orange de Noir de caráter único e provocador.',
   'wine', '', 'escape', 'vita-eterna',
   'Espumante Rosé / Orange', 'Champenoise / Maceração'),

  ('entre-terras-extra-brut-rose',
   'Entre Terras Extra Brut Rosé',
   'Produtora menor e menos conhecida que entrega um rosé espumante de alta performance, fora do circuito habitual.',
   'wine', '', 'escape', 'vinicola-tercas',
   'Espumante Rosé', 'Champenoise'),

  ('valmarino-cabernet-franc-xxvii-2022',
   'Valmarino Cabernet Franc Ano XXVII Safra 2022',
   'Prova que Pinto Bandeira produz tintos de alta qualidade — o Cab Franc da Valmarino rivaliza com referências nacionais.',
   'wine', '', 'escape', 'valmarino',
   'Vinho Tinto', NULL),

  ('don-giovanni-pinot-noir-2021',
   'Don Giovanni Pinot Noir 2021',
   'Derruba o mito de que a altitude de Pinto Bandeira só serve espumantes — Pinot Noir de expressão e delicadeza raras.',
   'wine', '', 'escape', 'don-giovanni',
   'Vinho Tinto', NULL),

  ('cave-amadeu-sur-lie-nature',
   'Cave Amadeu Sur Lie Nature',
   'Um dos espumantes mais minerais e complexos do portfolio Geisse — o método Sur Lie eleva ainda mais o potencial de guarda.',
   'wine', '', 'escape', 'familia-geisse',
   'Espumante Branco', 'Champenoise / Sur Lie')

ON CONFLICT (id) DO NOTHING;

-- Coleção: Ícone
INSERT INTO wine_items (id, name, description, type, image_url, level, brand_id, wine_type, elaboration_method) VALUES
  ('cave-geisse-terroir-nature',
   'Cave Geisse Terroir Nature',
   'Benchmark nacional — referência absoluta de espumante brasileiro pelo terroir, tempo de autólise e complexidade. Comparável a boas Champagnes de griffe.',
   'wine', '', 'icon', 'familia-geisse',
   'Espumante Branco', 'Champenoise'),

  ('cave-geisse-terroir-rose-nature',
   'Cave Geisse Terroir Rosé Nature',
   'Um dos rosés mais complexos e de maior potencial de guarda produzidos no Brasil. Expressão máxima do Pinot Noir sul-rio-grandense.',
   'wine', '', 'icon', 'familia-geisse',
   'Espumante Rosé', 'Champenoise'),

  ('don-giovanni-serie-ouro-60-meses',
   'Don Giovanni Série Ouro Extra Brut 60 meses',
   '60 meses de autólise colocam este espumante em nível de Champagne de prestígio — referência de tempo de guarda e complexidade.',
   'wine', '', 'icon', 'don-giovanni',
   'Espumante Branco', 'Champenoise'),

  ('cabernet-franc-churchill-2021',
   'Cabernet Franc Churchill Safra 2021',
   'Um dos melhores tintos do Brasil — faz a ponte entre o terroir de altitude de Pinto Bandeira e as grandes referências de Cabernet Franc do mundo.',
   'wine', '', 'icon', 'valmarino',
   'Vinho Tinto', 'Barrica de Carvalho Francês'),

  ('valmarino-blanc-de-blanc-2021',
   'Valmarino Blanc de Blanc D.O. Altos de Pinto Bandeira 2021',
   'Carregar a D.O. Altos de Pinto Bandeira é um selo de pureza e terroir — Blanc de Blancs que honra a designação com qualidade de safra.',
   'wine', '', 'icon', 'valmarino',
   'Espumante Branco', 'Champenoise')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COLLECTION ↔ WINE ITEMS
-- ============================================================

INSERT INTO collection_items (collection_id, item_id) VALUES
  -- Essencial
  ('pinto-bandeira-essencial', 'cave-geisse-rose-brut'),
  ('pinto-bandeira-essencial', 'cave-geisse-nature'),
  ('pinto-bandeira-essencial', 'don-giovanni-rose-pinot-noir-2022'),
  ('pinto-bandeira-essencial', 'espumante-aurora-pinto-bandeira-36-meses'),
  ('pinto-bandeira-essencial', 'espumante-vita-eterna-nature-2020'),
  -- Fora do Óbvio
  ('pinto-bandeira-fora-do-obvio', 'vita-eterna-orange-de-noir'),
  ('pinto-bandeira-fora-do-obvio', 'entre-terras-extra-brut-rose'),
  ('pinto-bandeira-fora-do-obvio', 'valmarino-cabernet-franc-xxvii-2022'),
  ('pinto-bandeira-fora-do-obvio', 'don-giovanni-pinot-noir-2021'),
  ('pinto-bandeira-fora-do-obvio', 'cave-amadeu-sur-lie-nature'),
  -- Ícone
  ('pinto-bandeira-icone', 'cave-geisse-terroir-nature'),
  ('pinto-bandeira-icone', 'cave-geisse-terroir-rose-nature'),
  ('pinto-bandeira-icone', 'don-giovanni-serie-ouro-60-meses'),
  ('pinto-bandeira-icone', 'cabernet-franc-churchill-2021'),
  ('pinto-bandeira-icone', 'valmarino-blanc-de-blanc-2021')
ON CONFLICT DO NOTHING;

-- ============================================================
-- WINE ITEMS ↔ REGIONS
-- ============================================================

INSERT INTO wine_item_regions (wine_item_id, region_id) VALUES
  ('cave-geisse-rose-brut',                   'pinto-bandeira'),
  ('cave-geisse-nature',                       'pinto-bandeira'),
  ('don-giovanni-rose-pinot-noir-2022',        'pinto-bandeira'),
  ('espumante-aurora-pinto-bandeira-36-meses', 'pinto-bandeira'),
  ('espumante-vita-eterna-nature-2020',        'pinto-bandeira'),
  ('vita-eterna-orange-de-noir',               'pinto-bandeira'),
  ('entre-terras-extra-brut-rose',             'pinto-bandeira'),
  ('valmarino-cabernet-franc-xxvii-2022',      'pinto-bandeira'),
  ('don-giovanni-pinot-noir-2021',             'pinto-bandeira'),
  ('cave-amadeu-sur-lie-nature',               'pinto-bandeira'),
  ('cave-geisse-terroir-nature',               'pinto-bandeira'),
  ('cave-geisse-terroir-rose-nature',          'pinto-bandeira'),
  ('don-giovanni-serie-ouro-60-meses',         'pinto-bandeira'),
  ('cabernet-franc-churchill-2021',            'pinto-bandeira'),
  ('valmarino-blanc-de-blanc-2021',            'pinto-bandeira')
ON CONFLICT DO NOTHING;

-- ============================================================
-- WINE ITEMS ↔ GRAPES
-- ============================================================

INSERT INTO wine_item_grapes (wine_item_id, grape_id) VALUES
  -- cave-geisse-rose-brut: Pinot Noir, Chardonnay
  ('cave-geisse-rose-brut', 'pinot-noir'),
  ('cave-geisse-rose-brut', 'chardonnay'),
  -- cave-geisse-nature: Chardonnay, Pinot Noir
  ('cave-geisse-nature', 'chardonnay'),
  ('cave-geisse-nature', 'pinot-noir'),
  -- don-giovanni-rose-pinot-noir-2022: Pinot Noir
  ('don-giovanni-rose-pinot-noir-2022', 'pinot-noir'),
  -- espumante-aurora-pinto-bandeira-36-meses: Chardonnay, Pinot Noir
  ('espumante-aurora-pinto-bandeira-36-meses', 'chardonnay'),
  ('espumante-aurora-pinto-bandeira-36-meses', 'pinot-noir'),
  -- espumante-vita-eterna-nature-2020: Chardonnay, Pinot Noir
  ('espumante-vita-eterna-nature-2020', 'chardonnay'),
  ('espumante-vita-eterna-nature-2020', 'pinot-noir'),
  -- vita-eterna-orange-de-noir: Pinot Noir
  ('vita-eterna-orange-de-noir', 'pinot-noir'),
  -- entre-terras-extra-brut-rose: Pinot Noir
  ('entre-terras-extra-brut-rose', 'pinot-noir'),
  -- valmarino-cabernet-franc-xxvii-2022: Cabernet Franc
  ('valmarino-cabernet-franc-xxvii-2022', 'cabernet-franc'),
  -- don-giovanni-pinot-noir-2021: Pinot Noir
  ('don-giovanni-pinot-noir-2021', 'pinot-noir'),
  -- cave-amadeu-sur-lie-nature: Chardonnay
  ('cave-amadeu-sur-lie-nature', 'chardonnay'),
  -- cave-geisse-terroir-nature: Chardonnay, Pinot Noir
  ('cave-geisse-terroir-nature', 'chardonnay'),
  ('cave-geisse-terroir-nature', 'pinot-noir'),
  -- cave-geisse-terroir-rose-nature: Pinot Noir, Chardonnay
  ('cave-geisse-terroir-rose-nature', 'pinot-noir'),
  ('cave-geisse-terroir-rose-nature', 'chardonnay'),
  -- don-giovanni-serie-ouro-60-meses: Chardonnay, Pinot Noir
  ('don-giovanni-serie-ouro-60-meses', 'chardonnay'),
  ('don-giovanni-serie-ouro-60-meses', 'pinot-noir'),
  -- cabernet-franc-churchill-2021: Cabernet Franc
  ('cabernet-franc-churchill-2021', 'cabernet-franc'),
  -- valmarino-blanc-de-blanc-2021: Chardonnay
  ('valmarino-blanc-de-blanc-2021', 'chardonnay')
ON CONFLICT DO NOTHING;
