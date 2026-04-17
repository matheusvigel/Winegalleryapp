-- ============================================================
-- Wine Gallery — Curadoria Brasileira (v3 — esquema real confirmado)
-- Serra da Mantiqueira (SP) + Pinto Bandeira (RS)
-- 30 vinhos · 11 vinícolas · 29 coleções
-- Idempotente: ON CONFLICT ... DO NOTHING em todos os inserts.
--
-- Schema real confirmado via MCP Supabase:
--   regions       → id (uuid), name, parent_id (uuid), level (varchar), photo, description
--   wineries      → id (uuid), name, photo, region_id (uuid), sub_region_id (uuid), category, highlight, buy_link
--   wines         → id (uuid), name, photo, winery_id (uuid), category, type, method, highlight, pairing, tasting_note, average_price, buy_link
--   collections   → id (uuid), title, photo, tagline, category, content_type, country_id (uuid), region_id (uuid), sub_region_id (uuid), is_mixed
--   collection_items → collection_id (uuid), item_id (uuid), item_type, position
--
-- UUIDs existentes usados:
--   Brasil              → 10000000-0000-0000-0000-000000000007
--   Serra Gaúcha        → 20000000-0000-0000-0000-000000000061
--   Pinto Bandeira      → 16a2029d-3584-46c6-8fa8-e8164dd96604
--   Espírito Santo do Pinhal → 58cc853b-ddc5-4841-ba07-c36f96345b50
--
-- Novos UUIDs reservados:
--   Serra da Mantiqueira → 50000000-0000-0000-0000-000000000001
--   Vinícolas            → 60000000-0000-0000-0000-0000000000XX  (01-11)
--   Vinhos               → 70000000-0000-0000-0000-0000000000XX  (01-30)
--   Coleções             → 80000000-0000-0000-0000-0000000000XX  (01-29)
-- ============================================================


-- ── 1. Região: Serra da Mantiqueira ─────────────────────────
-- Colunas: id, name, parent_id, level, photo, description
-- Espírito Santo do Pinhal (58cc853b-...) já existe com level='region', parent=Brasil

INSERT INTO regions (id, name, parent_id, level, photo, description)
VALUES
  ('50000000-0000-0000-0000-000000000001',
   'Serra da Mantiqueira',
   '10000000-0000-0000-0000-000000000007',  -- Brasil
   'region',
   '',
   'Viticultura de altitude entre São Paulo e Minas Gerais. Vinhos de frescor e precisão mineral, com Syrah e brancos expressivos acima de 900m.')
ON CONFLICT (id) DO NOTHING;


-- ── 2. Vinícolas ─────────────────────────────────────────────
-- Colunas: id, name, photo, region_id, sub_region_id, category, highlight, buy_link
--
-- Mantiqueira/Espírito Santo do Pinhal:
--   region_id    = 50000000-0000-0000-0000-000000000001  (Serra da Mantiqueira)
--   sub_region_id = 58cc853b-ddc5-4841-ba07-c36f96345b50 (Espírito Santo do Pinhal - SP)
--
-- Serra Gaúcha/Pinto Bandeira:
--   region_id    = 20000000-0000-0000-0000-000000000061  (Serra Gaúcha)
--   sub_region_id = 16a2029d-3584-46c6-8fa8-e8164dd96604 (Pinto Bandeira)

INSERT INTO wineries (id, name, photo, region_id, sub_region_id, category, highlight, buy_link)
VALUES
  -- ── Espírito Santo do Pinhal ──────────────────────────────

  ('60000000-0000-0000-0000-000000000001',
   'Guaspari', '',
   '50000000-0000-0000-0000-000000000001',
   '58cc853b-ddc5-4841-ba07-c36f96345b50',
   'Ícones',
   'Pioneira de Espírito Santo do Pinhal. O Vista do Chá Syrah foi premiado no Decanter World Wine Awards, colocando a Serra da Mantiqueira no mapa vinícola mundial.',
   'https://www.vinicolaguaspari.com.br'),

  ('60000000-0000-0000-0000-000000000002',
   'Amana', '',
   '50000000-0000-0000-0000-000000000001',
   '58cc853b-ddc5-4841-ba07-c36f96345b50',
   'Essencial',
   'Produtora com Sauvignon Blanc de frescor vibrante e Syrah de altitude. A linha premium Una mostra o potencial de guarda da região.',
   NULL),

  ('60000000-0000-0000-0000-000000000003',
   'Terra Nossa', '',
   '50000000-0000-0000-0000-000000000001',
   '58cc853b-ddc5-4841-ba07-c36f96345b50',
   'Fugir do óbvio',
   'Produtora artesanal que surpreende com Chenin Blanc raro no Brasil e Syrah Clássico de expressão internacional com coassagem de Viognier.',
   NULL),

  ('60000000-0000-0000-0000-000000000004',
   'Mirantus', '',
   '50000000-0000-0000-0000-000000000001',
   '58cc853b-ddc5-4841-ba07-c36f96345b50',
   'Essencial',
   'A vinícola mais alta de Espírito Santo do Pinhal, a 1.300m no Morro do Beletti. Syrah e Marselan de terroir extremo.',
   NULL),

  ('60000000-0000-0000-0000-000000000005',
   'Merum', '',
   '50000000-0000-0000-0000-000000000001',
   '58cc853b-ddc5-4841-ba07-c36f96345b50',
   'Essencial',
   'Vinícola jovem e criativa de Espírito Santo do Pinhal com espumantes Charmat de identidade única.',
   NULL),

  -- ── Pinto Bandeira ────────────────────────────────────────

  ('60000000-0000-0000-0000-000000000006',
   'Família Geisse', '',
   '20000000-0000-0000-0000-000000000061',
   '16a2029d-3584-46c6-8fa8-e8164dd96604',
   'Ícones',
   'Cave Geisse é o benchmark dos espumantes brasileiros pelo método Champenoise. O Terroir Nature rivaliza com boas Champagnes de griffe.',
   'https://loja.familiageisse.com.br'),

  ('60000000-0000-0000-0000-000000000007',
   'Vinícola Aurora', '',
   '20000000-0000-0000-0000-000000000061',
   '16a2029d-3584-46c6-8fa8-e8164dd96604',
   'Essencial',
   'Grande cooperativa da Serra Gaúcha com espumantes Champenoise de longa autólise. O Pinto Bandeira Extra Brut 36 Meses é custo-benefício imbatível.',
   'https://loja.vinicolaaurora.com.br'),

  ('60000000-0000-0000-0000-000000000008',
   'Vinícola Don Giovanni', '',
   '20000000-0000-0000-0000-000000000061',
   '16a2029d-3584-46c6-8fa8-e8164dd96604',
   'Ícones',
   'Referência em Pinto Bandeira por espumantes de longa autólise — a Série Ouro 60 Meses — e tintos finos como o Pinot Noir e o Rosé Pinot.',
   'https://www.dongiovanni.com.br'),

  ('60000000-0000-0000-0000-000000000009',
   'Vinícola Terraças', '',
   '20000000-0000-0000-0000-000000000061',
   '16a2029d-3584-46c6-8fa8-e8164dd96604',
   'Fugir do óbvio',
   'Pequena produtora de Pinto Bandeira fora do circuito usual. O Entre Terras Rosé Champenoise entrega alta performance abaixo do radar.',
   NULL),

  ('60000000-0000-0000-0000-000000000010',
   'Vinícola Valmarino', '',
   '20000000-0000-0000-0000-000000000061',
   '16a2029d-3584-46c6-8fa8-e8164dd96604',
   'Ícones',
   'Lar do Churchill Cabernet Franc, um dos melhores tintos do Brasil, e do Blanc de Blancs D.O. Altos de Pinto Bandeira.',
   'https://valmarino.com.br'),

  ('60000000-0000-0000-0000-000000000011',
   'Vinícola Vita Eterna', '',
   '20000000-0000-0000-0000-000000000061',
   '16a2029d-3584-46c6-8fa8-e8164dd96604',
   'Fugir do óbvio',
   'Produtora criativa de Pinto Bandeira. O Orange de Noir e o Nature de safra fogem completamente do convencional.',
   'https://loja.vitaeterna.com.br')

ON CONFLICT (id) DO NOTHING;


-- ── 3. Vinhos ────────────────────────────────────────────────
-- type CHECK: 'Tinto'|'Branco'|'Rosé'|'Espumante'|'Fortificado'|'Laranja'|'Sobremesa'
-- category CHECK: 'Essencial'|'Fugir do óbvio'|'Ícones'

INSERT INTO wines (id, name, photo, winery_id, category, type, method, highlight, pairing, tasting_note, average_price, buy_link)
VALUES

-- ── Guaspari ─────────────────────────────────────────────────
('70000000-0000-0000-0000-000000000001',
 'Guaspari Vale da Pedra Branco 2023', '',
 '60000000-0000-0000-0000-000000000001', 'Essencial', 'Branco', 'Inox',
 'Cartão de visitas dos brancos da Guaspari — Sauvignon Blanc que revela o frescor e a precisão do terroir de Espírito Santo do Pinhal.',
 'Frutos do mar, peixes brancos, ceviche, saladas',
 'Branco fresco e expressivo de altitude. Aromas de maracujá, limão-siciliano, ervas finas e notas minerais. Palato com boa acidez e finalização limpa.',
 205.00, 'https://www.vinicolaguaspari.com.br/produtos/vinhos/branco/vale-da-pedra.html'),

('70000000-0000-0000-0000-000000000002',
 'Guaspari Rosé 2023', '',
 '60000000-0000-0000-0000-000000000001', 'Essencial', 'Rosé', 'Inox',
 'Mostra a versatilidade da Guaspari — rosé gastronômico que equilibra frescor e expressividade de altitude.',
 'Frutos do mar, massas leves, queijos frescos, frios e aperitivos',
 'Rosé elegante com cor rosé-salmão vibrante. Aromas de morango, melancia, pétalas de rosa e leve especiaria. Palato fresco, leve e com boa acidez.',
 180.00, 'https://www.vinicolaguaspari.com.br/produtos/guaspari-rose-2024.html'),

('70000000-0000-0000-0000-000000000003',
 'Guaspari Vista do Chá Syrah 2022', '',
 '60000000-0000-0000-0000-000000000001', 'Fugir do óbvio', 'Tinto', 'Barrica de carvalho francês',
 'Vista do Chá é o vinho símbolo da Guaspari — Syrah premiado no Decanter que colocou Espírito Santo do Pinhal no mapa vinícola mundial.',
 'Carnes grelhadas, cordeiro, queijos curados, costelinha ao forno',
 'Syrah de altitude com identidade marcante. Aromas de frutas pretas maduras, pimenta preta, violeta e cedro. Taninos elegantes e final longo e mineral.',
 415.00, 'https://www.vinicolaguaspari.com.br/produtos/guaspari-syrah-vista-do-cha-2020.html'),

-- ── Amana ─────────────────────────────────────────────────────
('70000000-0000-0000-0000-000000000004',
 'Amana Sauvignon Blanc 2022', '',
 '60000000-0000-0000-0000-000000000002', 'Essencial', 'Branco', 'Inox',
 'Porta de entrada para os brancos da Amana — Sauvignon Blanc que expressa com clareza o terroir de altitude da Serra da Mantiqueira.',
 'Frutos do mar, ceviche, saladas, queijos de cabra',
 'Sauvignon Blanc concentrado e preciso, com pirazina marcada e frescor vibrante. Aromas herbáceos, cítricos e notas de maracujá.',
 205.00, NULL),

('70000000-0000-0000-0000-000000000005',
 'Amana Syrah 2022', '',
 '60000000-0000-0000-0000-000000000002', 'Essencial', 'Tinto', 'Inox',
 'Linha Amana sem barrica — Syrah que mostra a pureza da uva e o potencial do terroir sem intervenção de madeira.',
 'Massas ao molho de carne, carnes grelhadas, hambúrguer artesanal, queijos curados',
 'Syrah jovem e expressivo de altitude. Aromas de frutas vermelhas, amora, pimenta e violeta. Corpo médio, boa acidez e taninos macios.',
 205.00, NULL),

('70000000-0000-0000-0000-000000000006',
 'Una Syrah 2022', '',
 '60000000-0000-0000-0000-000000000002', 'Fugir do óbvio', 'Tinto', 'Barrica de carvalho francês',
 'Una é o lado sofisticado da Amana — Syrah com barrica que mostra o potencial de guarda da uva na altitude de Espírito Santo do Pinhal.',
 'Carnes vermelhas, cordeiro assado, queijos curados, risoto com funghi',
 'Syrah da linha premium Una com passagem por barricas de carvalho francês. Mais denso e complexo: aromas de frutas pretas, especiaria, couro e toque resinoso.',
 290.00, NULL),

('70000000-0000-0000-0000-000000000007',
 'Amana Rosé 2023', '',
 '60000000-0000-0000-0000-000000000002', 'Fugir do óbvio', 'Rosé', 'Inox',
 'Blend único de Syrah e Chenin Blanc — rosé que foge do óbvio e mostra o olhar criativo e o pioneirismo da Amana com a casta branca.',
 'Frutos do mar, pratos asiáticos, queijos suaves, massas ao molho rosé',
 'Rosé gastronômico produzido pela mescla inusitada de Syrah e Chenin Blanc. Notas de pera bem destacadas e toques de frutas vermelhas.',
 185.00, NULL),

-- ── Terra Nossa ───────────────────────────────────────────────
('70000000-0000-0000-0000-000000000008',
 'Terra Nossa Profano Syrah 2022', '',
 '60000000-0000-0000-0000-000000000003', 'Essencial', 'Tinto', 'Inox (8 meses sobre lias)',
 'Linha Profano é a democratização da Terra Nossa — Syrah de altitude a preço acessível com qualidade acima da categoria.',
 'Massas, risotos, carnes grelhadas, hambúrguer artesanal',
 'Syrah jovem e intenso sem passagem por barrica. Cor rubi intensa, aromas de frutas vermelhas, amora, ameixa e especiaria.',
 145.00, NULL),

('70000000-0000-0000-0000-000000000009',
 'Terra Nossa Clássico Syrah 2021', '',
 '60000000-0000-0000-0000-000000000003', 'Fugir do óbvio', 'Tinto', 'Barrica de carvalho francês',
 'Um dos vinhos mais esperados da Serra da Mantiqueira — Clássico Syrah que combina técnica e terroir em um tinto de expressão e elegância raras.',
 'Carnes vermelhas, cordeiro, risotos, queijos curados',
 'Syrah clássico com coassagem de Viognier. Cor vermelho profundo, aromas de frutas do bosque, especiarias e toque floral elegante. Final longo.',
 290.00, NULL),

('70000000-0000-0000-0000-000000000010',
 'Terra Nossa Chenin Blanc', '',
 '60000000-0000-0000-0000-000000000003', 'Fugir do óbvio', 'Branco', 'Inox',
 'Raridade no Brasil — Chenin Blanc da Serra da Mantiqueira que surpreende pela expressividade e coloca a Terra Nossa além dos tintos.',
 'Frutos do mar, peixes, queijos de pasta mole, pratos asiáticos leves',
 'Chenin Blanc de altitude com caráter marcante. Aromas de pêra, mel, flores brancas e notas minerais. Acidez vibrante, textura que remete ao Vale do Loire.',
 185.00, NULL),

-- ── Mirantus ──────────────────────────────────────────────────
('70000000-0000-0000-0000-000000000011',
 'Mirantus Syrah', '',
 '60000000-0000-0000-0000-000000000004', 'Essencial', 'Tinto', 'Inox',
 'Primeiro rótulo da vinícola mais alta de Espírito Santo do Pinhal — Syrah de 1.300m que traduz em taça o terroir extremo do Morro do Beletti.',
 'Carnes grelhadas, massas ao molho de carne, queijos curados',
 'Syrah de altitude cultivado a 1.300 metros no Morro do Beletti. Aromas de frutas vermelhas e negras, pimenta e violeta.',
 180.00, NULL),

('70000000-0000-0000-0000-000000000012',
 'Mirantus Marselan', '',
 '60000000-0000-0000-0000-000000000004', 'Fugir do óbvio', 'Tinto', 'Inox',
 'Uva raramente encontrada no Brasil — Mirantus aposta no Marselan para se diferenciar e mostrar que Espírito Santo do Pinhal vai além do Syrah.',
 'Carnes vermelhas, massas, queijos semi-curados, frios artesanais',
 'Marselan, cruzamento entre Cabernet Sauvignon e Grenache, ainda raro no Brasil. Aromas de frutas negras, amora, especiaria e floral.',
 180.00, NULL),

-- ── Merum ─────────────────────────────────────────────────────
('70000000-0000-0000-0000-000000000013',
 'Merum Espumante Brut', '',
 '60000000-0000-0000-0000-000000000005', 'Essencial', 'Espumante', 'Charmat',
 'Primeiro rótulo espumante de uma vinícola que nasce com identidade única — Merum entrega frescor e personalidade em sua estreia.',
 'Aperitivos, frutos do mar, queijos frescos, petiscos',
 'Espumante produzido pela jovem Merum a 900m. Bolhas vivas, aromas de maçã verde, limão e leve floral. Palato fresco e de fácil harmonização.',
 145.00, NULL),

('70000000-0000-0000-0000-000000000014',
 'Merum Espumante Rosé', '',
 '60000000-0000-0000-0000-000000000005', 'Fugir do óbvio', 'Espumante', 'Charmat',
 'Rosé espumante com alma de anfiteatro greco-romano — a Merum prova que Espírito Santo do Pinhal tem potencial além dos tranquilos.',
 'Frutos do mar, salmão, carpaccio, queijos frescos, aperitivos',
 'Espumante rosé com cor vibrante e aromas de morango, framboesa e floral. Palato fresco, de boa acidez e finalização frutada.',
 155.00, NULL),

-- ── Guaspari Ícone ────────────────────────────────────────────
('70000000-0000-0000-0000-000000000015',
 'Guaspari Terroir Syrah', '',
 '60000000-0000-0000-0000-000000000001', 'Ícones', 'Tinto', 'Barrica de carvalho francês',
 'Benchmark do vinho tinto paulista — Guaspari Terroir Syrah é o ícone que representa o ápice da viticultura de altitude da Serra da Mantiqueira.',
 'Costela assada, cordeiro, queijos maturados, charcuterie premium',
 'Topo de linha da Guaspari — Syrah de lotes selecionados com longa maturação em carvalho. Frutas pretas maduras, defumado, pimenta e terra.',
 750.00, NULL),

-- ── Família Geisse ────────────────────────────────────────────
('70000000-0000-0000-0000-000000000016',
 'Cave Geisse Rosé Brut', '',
 '60000000-0000-0000-0000-000000000006', 'Essencial', 'Espumante', 'Champenoise',
 'Cartão de visitas da Cave Geisse — introduz o estilo fino e elegante da vinícola com custo-benefício exemplar.',
 'Frutos do mar, ostras, salmão grelhado, queijos frescos, canapés',
 'Rosé elegante e sofisticado com perlage fino e persistente. Aromas de morango silvestre, framboesa, pétalas de rosa e leve brioche.',
 150.00, 'https://loja.familiageisse.com.br/cave-geisse/cave-geisse-rose-brut'),

('70000000-0000-0000-0000-000000000017',
 'Cave Geisse Nature', '',
 '60000000-0000-0000-0000-000000000006', 'Essencial', 'Espumante', 'Champenoise',
 'Referência da região no estilo Nature — pureza e terroir sem intervenção de açúcar.',
 'Ostras, frutos do mar crus, sashimi, queijos de massa dura',
 'Nature (dosagem zero) com caráter austero e mineral. Bolhas finas, aromas de pão tostado, maçã verde, limão siciliano e giz. Final longo e seco.',
 175.00, 'https://loja.familiageisse.com.br/cave-geisse/cave-geisse-nature'),

-- ── Vinícola Don Giovanni ─────────────────────────────────────
('70000000-0000-0000-0000-000000000018',
 'Don Giovanni Rosé Pinot Noir 2022', '',
 '60000000-0000-0000-0000-000000000008', 'Essencial', 'Rosé', NULL,
 'Mostra que Pinto Bandeira vai além do espumante — um rosé tranquilo de alta qualidade com identidade clara de terroir.',
 'Massas leves, peixes grelhados, queijos frescos, frios e aperitivos',
 'Rosé de Pinot Noir com cor rosa-salmão vibrante. Aromas de morango, framboesa, pétalas de rosa e leve especiaria. Palato fresco e de boa acidez.',
 110.00, 'https://www.dongiovanni.com.br/product/Vinho-Rose-Don-Giovanni-Pinot-Noir-2022-750-mL'),

-- ── Vinícola Aurora ───────────────────────────────────────────
('70000000-0000-0000-0000-000000000019',
 'Espumante Aurora Pinto Bandeira Extra Brut 36 Meses', '',
 '60000000-0000-0000-0000-000000000007', 'Essencial', 'Espumante', 'Champenoise',
 'Representa a expressão de grande cooperativa com qualidade de nível superior — 36 meses de autólise a preço acessível.',
 'Aperitivos, frutos do mar, risoto de funghi, massas ao molho manteiga',
 'Espumante de longa autólise com perlage fino e cremoso. Notas de brioche, maçã assada, limão e avelã. Acidez refrescante e final persistente.',
 140.00, 'https://loja.vinicolaaurora.com.br/products/aurora-pinto-bandeira-extra-brut-36-meses'),

-- ── Vinícola Vita Eterna ──────────────────────────────────────
('70000000-0000-0000-0000-000000000020',
 'Espumante Vita Eterna Nature 2020', '',
 '60000000-0000-0000-0000-000000000011', 'Essencial', 'Espumante', 'Champenoise',
 'Espumante de safra definida que evidencia o potencial enológico da Vita Eterna e do terroir de Pinto Bandeira.',
 'Ostras, frutos do mar, queijos curados, pratos de inspiração francesa',
 'Nature de colheita 2020 com marcante identidade de safra. Aromas de pão de queijo, frutas cítricas, mel e pederneira. Final mineral e longo.',
 185.00, 'https://loja.vitaeterna.com.br/espumante-nature'),

('70000000-0000-0000-0000-000000000021',
 'Vita Eterna Orange de Noir', '',
 '60000000-0000-0000-0000-000000000011', 'Fugir do óbvio', 'Espumante', 'Champenoise / Maceração',
 'Rompe com a lógica tradicional dos espumantes de Pinto Bandeira — um Orange de Noir de caráter único e provocador.',
 'Charcuterie, queijos curados, cogumelos, pato, risoto de beterraba',
 'Espumante com maceração da casca do Pinot Noir, conferindo cor rosé-cobre e taninos finos. Aromas de hibisco, damasco seco, framboesa e leve fumê.',
 210.00, 'https://loja.vitaeterna.com.br/espumante-orange-de-noir'),

-- ── Vinícola Terraças ─────────────────────────────────────────
('70000000-0000-0000-0000-000000000022',
 'Entre Terras Extra Brut Rosé', '',
 '60000000-0000-0000-0000-000000000009', 'Fugir do óbvio', 'Espumante', 'Champenoise',
 'Produtora menor e menos conhecida que entrega um rosé espumante de alta performance, fora do circuito habitual.',
 'Saladas de mar, frutos do mar, peixes ao molho de ervas, queijos frescos',
 'Rosé elegante com cor rosa-salmão e perlage persistente. Aromas de morango, framboesa, flores e leve brioche. Acidez presente e final de qualidade.',
 125.00, NULL),

-- ── Vinícola Valmarino ────────────────────────────────────────
('70000000-0000-0000-0000-000000000023',
 'Valmarino Cabernet Franc Ano XXVII Safra 2022', '',
 '60000000-0000-0000-0000-000000000010', 'Fugir do óbvio', 'Tinto', 'Barrica de carvalho',
 'Prova que Pinto Bandeira produz tintos de alta qualidade — o Cab Franc da Valmarino rivaliza com referências nacionais.',
 'Carnes grelhadas, cordeiro, queijos curados, macarrão à bolonhesa',
 'Cabernet Franc de altitude com personalidade marcante. Notas de pimenta verde, frutas vermelhas e pretas, grafite e especiarias. Taninos elegantes.',
 215.00, 'https://valmarino.com.br/products/cabernet-franc-ano-xxvii-750ml-safra-2022'),

-- ── Vinícola Don Giovanni Fugir ───────────────────────────────
('70000000-0000-0000-0000-000000000024',
 'Don Giovanni Pinot Noir 2021', '',
 '60000000-0000-0000-0000-000000000008', 'Fugir do óbvio', 'Tinto', 'Barrica de carvalho',
 'Derruba o mito de que a altitude de Pinto Bandeira só serve espumantes — Pinot Noir de expressão e delicadeza raras.',
 'Aves, salmão grelhado, cogumelos salteados, queijo brie',
 'Pinot Noir delicado com cor rubi-cereja. Aromas de cereja madura, framboesa, cogumelos e notas terrosas. Palato sedoso, taninos finos e final aromático.',
 235.00, 'https://www.dongiovanni.com.br/product/Vinho-Tinto-Don-Giovanni-Pinot-Noir-2021-750-mL'),

-- ── Família Geisse Fugir ──────────────────────────────────────
('70000000-0000-0000-0000-000000000025',
 'Cave Amadeu Sur Lie Nature', '',
 '60000000-0000-0000-0000-000000000006', 'Fugir do óbvio', 'Espumante', 'Champenoise / Sur Lie',
 'Um dos espumantes mais minerais e complexos do portfolio Geisse — o método Sur Lie eleva ainda mais o potencial de guarda.',
 'Frutos do mar, queijos curados, peixe ao molho branco, vieiras',
 'Produzido com permanência prolongada sobre as borras, conferindo cremosidade incomum. Aromas de pão, mel, nozes e cítrico. Palato denso, mineral e seco.',
 190.00, 'https://loja.familiageisse.com.br/cave-amadeu/cave-amadeu-rustico-nature'),

-- ── Família Geisse Ícones ─────────────────────────────────────
('70000000-0000-0000-0000-000000000026',
 'Cave Geisse Terroir Nature', '',
 '60000000-0000-0000-0000-000000000006', 'Ícones', 'Espumante', 'Champenoise',
 'Benchmark nacional — referência absoluta de espumante brasileiro pelo terroir, autólise e complexidade. Comparável a boas Champagnes de griffe.',
 'Frutos do mar nobres, caviar, ostras finas, queijos maturados de pasta dura',
 'O grande ícone da Cave Geisse. Perlage extremamente fino. Aromas de tostado, mel de abelha, maçã golden, limão Tahiti e pederneira. Final eterno.',
 500.00, 'https://loja.familiageisse.com.br/cave-geisse/cave-geisse-terroir-nature'),

('70000000-0000-0000-0000-000000000027',
 'Cave Geisse Terroir Rosé Nature', '',
 '60000000-0000-0000-0000-000000000006', 'Ícones', 'Espumante', 'Champenoise',
 'Um dos rosés mais complexos e de maior potencial de guarda produzidos no Brasil. Expressão máxima do Pinot Noir sul-rio-grandense.',
 'Frutos do mar, lagosta, foie gras, queijos de pasta mole envelhecida',
 'Versão rosé do lendário Terroir. Cor rosé-cobre, perlage sedutor. Aromas de brioche, morango confitado, rosa seca, especiaria e terra.',
 550.00, 'https://loja.familiageisse.com.br/cave-geisse/cave-geisse-terroir-rose-nature'),

-- ── Vinícola Don Giovanni Ícone ───────────────────────────────
('70000000-0000-0000-0000-000000000028',
 'Don Giovanni Série Ouro Extra Brut 60 meses', '',
 '60000000-0000-0000-0000-000000000008', 'Ícones', 'Espumante', 'Champenoise',
 '60 meses de autólise colocam este espumante em nível de Champagne de prestígio — referência de tempo de guarda e complexidade.',
 'Frutos do mar nobres, lagosta, camarão-pistola, queijos especiais, foie gras',
 'Obra-prima da Don Giovanni com 5 anos de autólise. Cor dourada intensa. Aromas de brioche tostado, avelã, baunilha, maracujá e mel. Final interminável.',
 600.00, 'https://www.dongiovanni.com.br/product/Vinho-Espumante-Don-Giovanni-Serie-Ouro-Extra-Brut-60-meses-750-mL'),

-- ── Vinícola Valmarino Ícones ─────────────────────────────────
('70000000-0000-0000-0000-000000000029',
 'Cabernet Franc Churchill Safra 2021', '',
 '60000000-0000-0000-0000-000000000010', 'Ícones', 'Tinto', 'Barrica de Carvalho Francês',
 'Um dos melhores tintos do Brasil — faz a ponte entre o terroir de altitude de Pinto Bandeira e as grandes referências de Cabernet Franc do mundo.',
 'Costela na brasa, cordeiro assado, queijos envelhecidos, charcuterie premium',
 'O ícone dos tintos de Pinto Bandeira. Notas de frutas pretas maduras, pimenta, grafite, tabaco e couro. Potencial de guarda de 10+ anos.',
 425.00, 'https://valmarino.com.br/products/cabernet-franc-churchill-safra-2020'),

('70000000-0000-0000-0000-000000000030',
 'Valmarino Blanc de Blanc D.O. Altos de Pinto Bandeira 2021', '',
 '60000000-0000-0000-0000-000000000010', 'Ícones', 'Espumante', 'Champenoise',
 'Carregar a D.O. Altos de Pinto Bandeira é um selo de pureza e terroir — Blanc de Blancs que honra a designação com qualidade de safra.',
 'Frutos do mar, ostras, ceviche, carpaccio de peixe, queijos de cabra',
 '100% Chardonnay com a D.O. mais restrita do Brasil. Perlage fino e elegante. Aromas de maçã verde, limão siciliano, pão tostado e minerais.',
 360.00, 'https://valmarino.com.br/products/espumante-blanc-de-blanc-d-o-altos-de-pinto-bandeira-2021')

ON CONFLICT (id) DO NOTHING;


-- ── 4. Coleções ──────────────────────────────────────────────
-- Colunas obrigatórias (NOT NULL): title, photo, tagline, category, content_type
-- Colunas opcionais: country_id, region_id, sub_region_id, is_mixed
-- category: 'Essencial' | 'Fugir do óbvio' | 'Ícones'
-- content_type: 'Vinhos'

INSERT INTO collections (id, title, photo, tagline, category, content_type, country_id, region_id, sub_region_id)
VALUES

-- ── Por Região: Espírito Santo do Pinhal ──────────────────────
('80000000-0000-0000-0000-000000000001',
 'Vinhos essenciais em Espírito Santo do Pinhal', '',
 'O ponto de partida para conhecer a Serra da Mantiqueira — os rótulos fundamentais que definem a identidade vinícola da região.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000002',
 'Fugir do óbvio em Espírito Santo do Pinhal', '',
 'Rótulos incomuns que revelam o lado mais criativo e audacioso da viticultura de altitude da Serra da Mantiqueira.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000003',
 'Ícones em Espírito Santo do Pinhal', '',
 'Os grandes vinhos que colocaram a Serra da Mantiqueira no mapa mundial — o ápice da viticultura paulista.',
 'Ícones', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

-- ── Por Região: Pinto Bandeira ────────────────────────────────
('80000000-0000-0000-0000-000000000004',
 'Vinhos essenciais em Pinto Bandeira', '',
 'Os rótulos que melhor representam a D.O. Pinto Bandeira — espumantes Champenoise e rosés que definem a identidade única da região.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000005',
 'Fugir do óbvio em Pinto Bandeira', '',
 'Para além dos espumantes clássicos — vinhos de caráter único que revelam o potencial inexplorado de Pinto Bandeira.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000006',
 'Ícones em Pinto Bandeira', '',
 'Os grandes ícones que definem o teto de qualidade de Pinto Bandeira — vinhos de referência nacional e internacional.',
 'Ícones', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

-- ── Por Vinícola: Amana ───────────────────────────────────────
('80000000-0000-0000-0000-000000000007',
 'Vinhos essenciais da Amana', '',
 'Os rótulos mais representativos da Amana — ponto de partida para conhecer o Sauvignon Blanc e o Syrah de altitude.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000008',
 'Fugir do óbvio da Amana', '',
 'O lado mais criativo da Amana — a linha Una e o Rosé inusitado de Syrah e Chenin Blanc que fogem de qualquer padrão.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

-- ── Por Vinícola: Família Geisse ──────────────────────────────
('80000000-0000-0000-0000-000000000009',
 'Vinhos essenciais da Família Geisse', '',
 'A porta de entrada para a Cave Geisse — os espumantes que definem o padrão de excelência dos Champenoise brasileiros.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000010',
 'Fugir do óbvio da Família Geisse', '',
 'O portfolio menos óbvio da Geisse — o Cave Amadeu Sur Lie que revela complexidade e personalidade únicas.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000011',
 'Ícones da Família Geisse', '',
 'Os espumantes ícones que transformaram a Cave Geisse em referência absoluta dos espumantes finos do Brasil.',
 'Ícones', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

-- ── Por Vinícola: Guaspari ────────────────────────────────────
('80000000-0000-0000-0000-000000000012',
 'Vinhos essenciais da Guaspari', '',
 'O ponto de entrada para o universo Guaspari — o Branco e o Rosé que revelam o terroir de altitude com elegância e frescor.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000013',
 'Fugir do óbvio da Guaspari', '',
 'O Vista do Chá Syrah — o vinho que colocou Espírito Santo do Pinhal no mapa ao vencer no Decanter World Wine Awards.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000014',
 'Ícones da Guaspari', '',
 'O Terroir Syrah — o ápice da Guaspari e benchmark do vinho tinto de altitude paulista.',
 'Ícones', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

-- ── Por Vinícola: Merum ───────────────────────────────────────
('80000000-0000-0000-0000-000000000015',
 'Vinhos essenciais da Merum', '',
 'A estreia da Merum em espumantes — frescor e personalidade de altitude num formato acessível e versátil.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000016',
 'Fugir do óbvio da Merum', '',
 'O Rosé espumante da Merum — borbulhas de personalidade que desafiam a convenção dos espumantes da região.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

-- ── Por Vinícola: Mirantus ────────────────────────────────────
('80000000-0000-0000-0000-000000000017',
 'Vinhos essenciais da Mirantus', '',
 'O Syrah da vinícola mais alta de Espírito Santo do Pinhal — altitude extrema que se traduz em taça.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000018',
 'Fugir do óbvio da Mirantus', '',
 'O Marselan da Mirantus — uva rara no Brasil que surpreende e coloca a vinícola além dos Syrahs da região.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

-- ── Por Vinícola: Terra Nossa ─────────────────────────────────
('80000000-0000-0000-0000-000000000019',
 'Vinhos essenciais da Terra Nossa', '',
 'O Profano Syrah — democratização de altitude, ponto de entrada acessível para o universo da Terra Nossa.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

('80000000-0000-0000-0000-000000000020',
 'Fugir do óbvio da Terra Nossa', '',
 'O Clássico Syrah e o raro Chenin Blanc — os vinhos que revelam a face mais surpreendente e criativa da Terra Nossa.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '50000000-0000-0000-0000-000000000001',
 '58cc853b-ddc5-4841-ba07-c36f96345b50'),

-- ── Por Vinícola: Aurora ──────────────────────────────────────
('80000000-0000-0000-0000-000000000021',
 'Vinhos essenciais da Vinícola Aurora', '',
 'O Extra Brut 36 Meses — qualidade Champenoise de grande cooperativa a preço acessível. Custo-benefício imbatível de Pinto Bandeira.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

-- ── Por Vinícola: Don Giovanni ────────────────────────────────
('80000000-0000-0000-0000-000000000022',
 'Vinhos essenciais da Vinícola Don Giovanni', '',
 'O Rosé Pinot Noir — o vinho que prova que Pinto Bandeira vai muito além dos espumantes.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000023',
 'Fugir do óbvio da Vinícola Don Giovanni', '',
 'O Pinot Noir tinto da Don Giovanni — silenciosamente um dos melhores tintos do Sul do Brasil.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000024',
 'Ícones da Vinícola Don Giovanni', '',
 'A Série Ouro Extra Brut 60 Meses — 5 anos de autólise que colocam a Don Giovanni em nível de Champagne de prestígio.',
 'Ícones', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

-- ── Por Vinícola: Terraças ────────────────────────────────────
('80000000-0000-0000-0000-000000000025',
 'Fugir do óbvio da Vinícola Terraças', '',
 'O Entre Terras Rosé fora do radar — alta performance abaixo do circuito usual de Pinto Bandeira.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

-- ── Por Vinícola: Valmarino ───────────────────────────────────
('80000000-0000-0000-0000-000000000026',
 'Fugir do óbvio da Vinícola Valmarino', '',
 'O Cabernet Franc Ano XXVII — tinto de altitude que rivaliza com as grandes referências nacionais.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000027',
 'Ícones da Vinícola Valmarino', '',
 'O Churchill Cabernet Franc e o Blanc de Blancs D.O. — os dois ícones que definem o DNA premium da Valmarino.',
 'Ícones', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

-- ── Por Vinícola: Vita Eterna ─────────────────────────────────
('80000000-0000-0000-0000-000000000028',
 'Vinhos essenciais da Vinícola Vita Eterna', '',
 'O Nature 2020 — espumante de safra que evidencia o potencial e a precisão da Vita Eterna no terroir de Pinto Bandeira.',
 'Essencial', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604'),

('80000000-0000-0000-0000-000000000029',
 'Fugir do óbvio da Vinícola Vita Eterna', '',
 'O Orange de Noir — espumante com maceração de casca que rompe completamente com os padrões da região.',
 'Fugir do óbvio', 'Vinhos',
 '10000000-0000-0000-0000-000000000007',
 '20000000-0000-0000-0000-000000000061',
 '16a2029d-3584-46c6-8fa8-e8164dd96604')

ON CONFLICT (id) DO NOTHING;


-- ── 5. Itens das Coleções ────────────────────────────────────
-- PK composta: (collection_id, item_id, item_type)

INSERT INTO collection_items (collection_id, item_id, item_type, position)
VALUES

-- 01 br-esp-essencial: wines 1,2,4,5,8,11,13
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','wine',1),
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002','wine',2),
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000004','wine',3),
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000005','wine',4),
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000008','wine',5),
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000011','wine',6),
('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000013','wine',7),

-- 02 br-esp-fugir: wines 3,6,7,9,10,12,14
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000003','wine',1),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000006','wine',2),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000007','wine',3),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000009','wine',4),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000010','wine',5),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000012','wine',6),
('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000014','wine',7),

-- 03 br-esp-icone: wine 15
('80000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000015','wine',1),

-- 04 br-pb-essencial: wines 16,17,18,19,20
('80000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000016','wine',1),
('80000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000017','wine',2),
('80000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000018','wine',3),
('80000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000019','wine',4),
('80000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000020','wine',5),

-- 05 br-pb-fugir: wines 21,22,23,24,25
('80000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000021','wine',1),
('80000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000022','wine',2),
('80000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000023','wine',3),
('80000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000024','wine',4),
('80000000-0000-0000-0000-000000000005','70000000-0000-0000-0000-000000000025','wine',5),

-- 06 br-pb-icone: wines 26,27,28,29,30
('80000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000026','wine',1),
('80000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000027','wine',2),
('80000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000028','wine',3),
('80000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000029','wine',4),
('80000000-0000-0000-0000-000000000006','70000000-0000-0000-0000-000000000030','wine',5),

-- 07 br-amana-essencial: wines 4,5
('80000000-0000-0000-0000-000000000007','70000000-0000-0000-0000-000000000004','wine',1),
('80000000-0000-0000-0000-000000000007','70000000-0000-0000-0000-000000000005','wine',2),

-- 08 br-amana-fugir: wines 6,7
('80000000-0000-0000-0000-000000000008','70000000-0000-0000-0000-000000000006','wine',1),
('80000000-0000-0000-0000-000000000008','70000000-0000-0000-0000-000000000007','wine',2),

-- 09 br-geisse-essencial: wines 16,17
('80000000-0000-0000-0000-000000000009','70000000-0000-0000-0000-000000000016','wine',1),
('80000000-0000-0000-0000-000000000009','70000000-0000-0000-0000-000000000017','wine',2),

-- 10 br-geisse-fugir: wine 25
('80000000-0000-0000-0000-000000000010','70000000-0000-0000-0000-000000000025','wine',1),

-- 11 br-geisse-icone: wines 26,27
('80000000-0000-0000-0000-000000000011','70000000-0000-0000-0000-000000000026','wine',1),
('80000000-0000-0000-0000-000000000011','70000000-0000-0000-0000-000000000027','wine',2),

-- 12 br-guaspari-essencial: wines 1,2
('80000000-0000-0000-0000-000000000012','70000000-0000-0000-0000-000000000001','wine',1),
('80000000-0000-0000-0000-000000000012','70000000-0000-0000-0000-000000000002','wine',2),

-- 13 br-guaspari-fugir: wine 3
('80000000-0000-0000-0000-000000000013','70000000-0000-0000-0000-000000000003','wine',1),

-- 14 br-guaspari-icone: wine 15
('80000000-0000-0000-0000-000000000014','70000000-0000-0000-0000-000000000015','wine',1),

-- 15 br-merum-essencial: wine 13
('80000000-0000-0000-0000-000000000015','70000000-0000-0000-0000-000000000013','wine',1),

-- 16 br-merum-fugir: wine 14
('80000000-0000-0000-0000-000000000016','70000000-0000-0000-0000-000000000014','wine',1),

-- 17 br-mirantus-essencial: wine 11
('80000000-0000-0000-0000-000000000017','70000000-0000-0000-0000-000000000011','wine',1),

-- 18 br-mirantus-fugir: wine 12
('80000000-0000-0000-0000-000000000018','70000000-0000-0000-0000-000000000012','wine',1),

-- 19 br-terranossa-essencial: wine 8
('80000000-0000-0000-0000-000000000019','70000000-0000-0000-0000-000000000008','wine',1),

-- 20 br-terranossa-fugir: wines 9,10
('80000000-0000-0000-0000-000000000020','70000000-0000-0000-0000-000000000009','wine',1),
('80000000-0000-0000-0000-000000000020','70000000-0000-0000-0000-000000000010','wine',2),

-- 21 br-aurora-essencial: wine 19
('80000000-0000-0000-0000-000000000021','70000000-0000-0000-0000-000000000019','wine',1),

-- 22 br-dongiovanni-essencial: wine 18
('80000000-0000-0000-0000-000000000022','70000000-0000-0000-0000-000000000018','wine',1),

-- 23 br-dongiovanni-fugir: wine 24
('80000000-0000-0000-0000-000000000023','70000000-0000-0000-0000-000000000024','wine',1),

-- 24 br-dongiovanni-icone: wine 28
('80000000-0000-0000-0000-000000000024','70000000-0000-0000-0000-000000000028','wine',1),

-- 25 br-tercas-fugir: wine 22
('80000000-0000-0000-0000-000000000025','70000000-0000-0000-0000-000000000022','wine',1),

-- 26 br-valmarino-fugir: wine 23
('80000000-0000-0000-0000-000000000026','70000000-0000-0000-0000-000000000023','wine',1),

-- 27 br-valmarino-icone: wines 29,30
('80000000-0000-0000-0000-000000000027','70000000-0000-0000-0000-000000000029','wine',1),
('80000000-0000-0000-0000-000000000027','70000000-0000-0000-0000-000000000030','wine',2),

-- 28 br-vitaeterna-essencial: wine 20
('80000000-0000-0000-0000-000000000028','70000000-0000-0000-0000-000000000020','wine',1),

-- 29 br-vitaeterna-fugir: wine 21
('80000000-0000-0000-0000-000000000029','70000000-0000-0000-0000-000000000021','wine',1)

ON CONFLICT DO NOTHING;
