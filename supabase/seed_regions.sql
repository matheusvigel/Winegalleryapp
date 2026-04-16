-- ============================================================
-- SEED: regions
-- Ordem obrigatória: países → regiões → sub-regiões
-- (parent_id referencia outro registro nesta mesma tabela)
-- ============================================================

-- ── PAÍSES ──────────────────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'França',          'country', NULL, '', 'O maior produtor de vinhos finos do mundo, lar de Bordeaux, Borgonha e Champagne.'),
  ('10000000-0000-0000-0000-000000000002', 'Itália',          'country', NULL, '', 'País com a maior diversidade de castas autóctones, do Barolo ao Brunello.'),
  ('10000000-0000-0000-0000-000000000003', 'Portugal',        'country', NULL, '', 'Terra do Vinho Verde, do Douro e dos vinhos fortificados do Porto.'),
  ('10000000-0000-0000-0000-000000000004', 'Espanha',         'country', NULL, '', 'Da Rioja à Ribera del Duero, vinhos de caráter e tradição milenar.'),
  ('10000000-0000-0000-0000-000000000005', 'Argentina',       'country', NULL, '', 'Maior produtor da América do Sul, famoso pelo Malbec de Mendoza.'),
  ('10000000-0000-0000-0000-000000000006', 'Chile',           'country', NULL, '', 'Vinhos de altitude com Carménère, Cabernet Sauvignon e Pinot Noir.'),
  ('10000000-0000-0000-0000-000000000007', 'Brasil',          'country', NULL, '', 'Serra Gaúcha e o Planalto Catarinense produzem espumantes e tintos de altitude.'),
  ('10000000-0000-0000-0000-000000000008', 'Estados Unidos',  'country', NULL, '', 'Napa Valley e Sonoma definiram o padrão dos grandes Cabernet Sauvignons do Novo Mundo.'),
  ('10000000-0000-0000-0000-000000000009', 'Alemanha',        'country', NULL, '', 'Rieslings de Mosel e Rheingau são referências mundiais em vinhos brancos.'),
  ('10000000-0000-0000-0000-000000000010', 'Austrália',       'country', NULL, '', 'Shiraz de Barossa Valley e Chardonnay de Margaret River conquistaram o mundo.');

-- ── REGIÕES — FRANÇA ────────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Bordeaux',   'region', '10000000-0000-0000-0000-000000000001', '', 'Lar de Château Pétrus, Margaux e Mouton. Cabernet Sauvignon e Merlot dominam.'),
  ('20000000-0000-0000-0000-000000000002', 'Borgonha',   'region', '10000000-0000-0000-0000-000000000001', '', 'Pinot Noir e Chardonnay nos terroirs mais cobiçados do planeta.'),
  ('20000000-0000-0000-0000-000000000003', 'Champagne',  'region', '10000000-0000-0000-0000-000000000001', '', 'A região que deu nome ao espumante mais icônico do mundo.'),
  ('20000000-0000-0000-0000-000000000004', 'Rhône',      'region', '10000000-0000-0000-0000-000000000001', '', 'Syrah no norte, blends com Grenache no sul. Hermitage e Châteauneuf-du-Pape.'),
  ('20000000-0000-0000-0000-000000000005', 'Loire',      'region', '10000000-0000-0000-0000-000000000001', '', 'Muscadet, Sancerre, Pouilly-Fumé e Chinon ao longo do Vale do Loire.'),
  ('20000000-0000-0000-0000-000000000006', 'Alsácia',    'region', '10000000-0000-0000-0000-000000000001', '', 'Riesling, Gewurztraminer e Pinot Gris aromáticos na fronteira com a Alemanha.');

-- ── REGIÕES — ITÁLIA ────────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000011', 'Piemonte',   'region', '10000000-0000-0000-0000-000000000002', '', 'Lar do Barolo e Barbaresco, os "reis" do vinho italiano. Nebbiolo é a uva nobre.'),
  ('20000000-0000-0000-0000-000000000012', 'Toscana',    'region', '10000000-0000-0000-0000-000000000002', '', 'Chianti, Brunello di Montalcino e Supertoscanos de classe mundial.'),
  ('20000000-0000-0000-0000-000000000013', 'Vêneto',     'region', '10000000-0000-0000-0000-000000000002', '', 'Amarone, Prosecco e Soave. Uma das regiões mais produtivas da Itália.'),
  ('20000000-0000-0000-0000-000000000014', 'Sicília',    'region', '10000000-0000-0000-0000-000000000002', '', 'Nero d''Avola e Nerello Mascalese nos solos vulcânicos do Etna.');

-- ── REGIÕES — PORTUGAL ──────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000021', 'Douro',        'region', '10000000-0000-0000-0000-000000000003', '', 'Vale do Douro: berço do Vinho do Porto e de tintos secos de altitude.'),
  ('20000000-0000-0000-0000-000000000022', 'Alentejo',     'region', '10000000-0000-0000-0000-000000000003', '', 'Planície quente com Aragonez, Trincadeira e Alicante Bouschet.'),
  ('20000000-0000-0000-0000-000000000023', 'Vinho Verde',  'region', '10000000-0000-0000-0000-000000000003', '', 'Brancos leves e efervescentes do noroeste português. Alvarinho como destaque.'),
  ('20000000-0000-0000-0000-000000000024', 'Lisboa',       'region', '10000000-0000-0000-0000-000000000003', '', 'Colares, Óbidos e Alenquer — diversidade próxima da capital.');

-- ── REGIÕES — ESPANHA ───────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000031', 'Rioja',           'region', '10000000-0000-0000-0000-000000000004', '', 'Tempranillo envelhecido em carvalho americano. Referência espanhola clássica.'),
  ('20000000-0000-0000-0000-000000000032', 'Ribera del Duero','region', '10000000-0000-0000-0000-000000000004', '', 'Altitude e extremos: berço do Vega Sicilia e do Pingus.'),
  ('20000000-0000-0000-0000-000000000033', 'Priorat',         'region', '10000000-0000-0000-0000-000000000004', '', 'Solos de llicorella, Garnacha e Cariñena de concentração extrema.');

-- ── REGIÕES — ARGENTINA ─────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000041', 'Mendoza',     'region', '10000000-0000-0000-0000-000000000005', '', 'A capital do Malbec argentino. Luján de Cuyo e Vale do Uco são os pólos finos.'),
  ('20000000-0000-0000-0000-000000000042', 'Salta',       'region', '10000000-0000-0000-0000-000000000005', '', 'Vinhedos a mais de 2.000m de altitude. Torrontés aromático e tintos intensos.'),
  ('20000000-0000-0000-0000-000000000043', 'Patagônia',   'region', '10000000-0000-0000-0000-000000000005', '', 'Sul frio e ventoso com Pinot Noir e Malbec elegantes. Rio Negro e Neuquén.');

-- ── REGIÕES — CHILE ─────────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000051', 'Valle Central',  'region', '10000000-0000-0000-0000-000000000006', '', 'Maipo, Rapel, Curicó e Maule. Cabernet Sauvignon e Carménère clássicos.'),
  ('20000000-0000-0000-0000-000000000052', 'Casablanca',     'region', '10000000-0000-0000-0000-000000000006', '', 'Vale costeiro e frio com Chardonnay e Sauvignon Blanc de excelência.'),
  ('20000000-0000-0000-0000-000000000053', 'Colchagua',      'region', '10000000-0000-0000-0000-000000000006', '', 'Um dos vales mais quentes do Chile. Syrah, Malbec e Carménère potentes.');

-- ── REGIÕES — BRASIL ────────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000061', 'Serra Gaúcha',          'region', '10000000-0000-0000-0000-000000000007', '', 'Caxias do Sul, Bento Gonçalves e Garibaldi. Espumantes pelo método Champenoise.'),
  ('20000000-0000-0000-0000-000000000062', 'Campanha Gaúcha',       'region', '10000000-0000-0000-0000-000000000007', '', 'Fronteira com o Uruguai, solos arenosos e noites frescas. Cabernet e Tannat.'),
  ('20000000-0000-0000-0000-000000000063', 'Planalto Catarinense',  'region', '10000000-0000-0000-0000-000000000007', '', 'São Joaquim e Campos de Palmas a 1.400m. Pinot Noir e Cabernet Franc elegantes.');

-- ── REGIÕES — EUA ───────────────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('20000000-0000-0000-0000-000000000071', 'Napa Valley',    'region', '10000000-0000-0000-0000-000000000008', '', 'O vale mais famoso da América. Cabernet Sauvignon de classe mundial.'),
  ('20000000-0000-0000-0000-000000000072', 'Sonoma',         'region', '10000000-0000-0000-0000-000000000008', '', 'Diversidade: Pinot Noir de Russian River, Chardonnay e Zinfandel.');

-- ── SUB-REGIÕES — BORDEAUX ──────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Margaux',         'sub-region', '20000000-0000-0000-0000-000000000001', '', 'A mais elegante das appellation do Médoc. Terroir de textura sedosa.'),
  ('30000000-0000-0000-0000-000000000002', 'Pauillac',        'sub-region', '20000000-0000-0000-0000-000000000001', '', 'Lar de Latour, Lafite e Mouton. Cabernet Sauvignon estruturado e longevo.'),
  ('30000000-0000-0000-0000-000000000003', 'Saint-Émilion',   'sub-region', '20000000-0000-0000-0000-000000000001', '', 'Merlot dominante na Margem Direita. Pétrus e Cheval Blanc aqui residem.'),
  ('30000000-0000-0000-0000-000000000004', 'Pomerol',         'sub-region', '20000000-0000-0000-0000-000000000001', '', 'Pequena appellation com solos de argila. Pétrus, o mais caro do mundo.');

-- ── SUB-REGIÕES — BORGONHA ──────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('30000000-0000-0000-0000-000000000011', 'Côte de Nuits',   'sub-region', '20000000-0000-0000-0000-000000000002', '', 'Gevrey-Chambertin, Vosne-Romanée, Chambolle-Musigny. Pinot Noir supremo.'),
  ('30000000-0000-0000-0000-000000000012', 'Côte de Beaune',  'sub-region', '20000000-0000-0000-0000-000000000002', '', 'Meursault, Puligny e Chassagne-Montrachet. Os maiores Chardonnays do mundo.'),
  ('30000000-0000-0000-0000-000000000013', 'Chablis',         'sub-region', '20000000-0000-0000-0000-000000000002', '', 'Chardonnay mineral e sem madeira nos solos calcários de Kimmeridgiano.');

-- ── SUB-REGIÕES — MENDOZA ───────────────────────────────────
INSERT INTO regions (id, name, level, parent_id, photo, description) VALUES
  ('30000000-0000-0000-0000-000000000021', 'Luján de Cuyo',   'sub-region', '20000000-0000-0000-0000-000000000041', '', 'Malbec clássico de altitude média. Vinhedos centenários de Vistalba e Perdriel.'),
  ('30000000-0000-0000-0000-000000000022', 'Valle de Uco',    'sub-region', '20000000-0000-0000-0000-000000000041', '', 'Tupungato e Tunuyán acima de 1.000m. Malbec e Cabernet de precisão e frescor.');
