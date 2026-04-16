-- ============================================================
-- SEED: wineries (vinícolas)
-- Depende de seed_regions.sql já aplicado.
-- photo: deixar '' por enquanto — adicionar via backoffice.
-- ============================================================

INSERT INTO wineries (id, name, photo, region_id, sub_region_id, category, highlight, buy_link) VALUES

-- ── BORDEAUX ────────────────────────────────────────────────
('40000000-0000-0000-0000-000000000001', 'Château Margaux',       '', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Ícones',         'Primeiro Grand Cru Classé de Margaux, sinônimo de elegância e finesse no Médoc.', NULL),
('40000000-0000-0000-0000-000000000002', 'Château Pétrus',        '', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Ícones',         'O vinho mais cobiçado do mundo. Merlot puro em solo de argila azul em Pomerol.', NULL),
('40000000-0000-0000-0000-000000000003', 'Château Mouton Rothschild', '', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Ícones',       'Primeiro Grand Cru de Pauillac com rótulos assinados por artistas como Dalí e Picasso.', NULL),
('40000000-0000-0000-0000-000000000004', 'Château Lynch-Bages',   '', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Fugir do óbvio', 'Quinto Grand Cru com qualidade de segundo. Clássico acessível de Pauillac.', NULL),
('40000000-0000-0000-0000-000000000005', 'Château Léoville-Barton','', '20000000-0000-0000-0000-000000000001', NULL,                                   'Fugir do óbvio', 'Saint-Julien de custo-benefício imbatível entre os Seconds Crus Classés.', NULL),

-- ── BORGONHA ────────────────────────────────────────────────
('40000000-0000-0000-0000-000000000011', 'Domaine de la Romanée-Conti', '', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011', 'Ícones',    'A DRC produz os vinhos mais raros e caros do mundo: La Tâche, Romanée-Conti, Richebourg.', NULL),
('40000000-0000-0000-0000-000000000012', 'Domaine Leroy',          '', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011', 'Ícones',         'Lalou Bize-Leroy redefiniu a biodinâmica em Borgonha. Vinhos de precisão cirúrgica.', NULL),
('40000000-0000-0000-0000-000000000013', 'Domaine Leflaive',       '', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000012', 'Ícones',         'O maior nome em Chardonnay branco de Borgonha. Puligny-Montrachet de referência.', NULL),
('40000000-0000-0000-0000-000000000014', 'Domaine Faiveley',       '', '20000000-0000-0000-0000-000000000002', NULL,                                   'Essencial',      'Uma das maiores maisons de Borgonha com terroirs em toda a Côte d''Or.', NULL),

-- ── CHAMPAGNE ───────────────────────────────────────────────
('40000000-0000-0000-0000-000000000021', 'Krug',                   '', '20000000-0000-0000-0000-000000000003', NULL, 'Ícones',         'A maison de luxe: cada Krug Grande Cuvée é uma obra de anos de envelhecimento.', NULL),
('40000000-0000-0000-0000-000000000022', 'Dom Pérignon',           '', '20000000-0000-0000-0000-000000000003', NULL, 'Ícones',         'Prestige cuvée da Moët & Chandon. O nome mais icônico do Champagne no mundo.', NULL),
('40000000-0000-0000-0000-000000000023', 'Billecart-Salmon',       '', '20000000-0000-0000-0000-000000000003', NULL, 'Fugir do óbvio', 'Família independente desde 1818. Rosé Brut e Blanc de Blancs de elegância ímpar.', NULL),
('40000000-0000-0000-0000-000000000024', 'Egly-Ouriet',            '', '20000000-0000-0000-0000-000000000003', NULL, 'Fugir do óbvio', 'Récoltant-manipulant de culto em Ambonnay. Champagnes de intensidade e profundidade.', NULL),

-- ── PIEMONTE ────────────────────────────────────────────────
('40000000-0000-0000-0000-000000000031', 'Giacomo Conterno',       '', '20000000-0000-0000-0000-000000000011', NULL, 'Ícones',         'O Monfortino é o Barolo mais longevo e reverenciado da Itália. Tradição pura.', NULL),
('40000000-0000-0000-0000-000000000032', 'Gaja',                   '', '20000000-0000-0000-0000-000000000011', NULL, 'Ícones',         'Angelo Gaja modernizou o Piemonte. Barolo, Barbaresco e os Supertoscanos ''Sperss'' e ''Conteisa''.', NULL),
('40000000-0000-0000-0000-000000000033', 'Bruno Giacosa',          '', '20000000-0000-0000-0000-000000000011', NULL, 'Ícones',         'O ''maestro'' do Barolo. Falletto di Serralunga e Santo Stefano são ícones absolutos.', NULL),
('40000000-0000-0000-0000-000000000034', 'Vietti',                 '', '20000000-0000-0000-0000-000000000011', NULL, 'Fugir do óbvio', 'Múltiplos crus de Barolo com expressão de terroir única. Lazzarito e Ravera no topo.', NULL),

-- ── TOSCANA ─────────────────────────────────────────────────
('40000000-0000-0000-0000-000000000041', 'Sassicaia (Tenuta San Guido)', '', '20000000-0000-0000-0000-000000000012', NULL, 'Ícones',    'O Supertoscano que nasceu com DOC própria. Cabernet Sauvignon de Bolgheri.', NULL),
('40000000-0000-0000-0000-000000000042', 'Ornellaia',              '', '20000000-0000-0000-0000-000000000012', NULL, 'Ícones',         'Blend bordalês em Bolgheri. Entre os vinhos mais desejados da Itália.', NULL),
('40000000-0000-0000-0000-000000000043', 'Biondi-Santi',           '', '20000000-0000-0000-0000-000000000012', NULL, 'Ícones',         'A família que criou o Brunello di Montalcino. Riserva Annata é um monumento.', NULL),
('40000000-0000-0000-0000-000000000044', 'Antinori',               '', '20000000-0000-0000-0000-000000000012', NULL, 'Essencial',      'Tignanello criou o conceito de Supertoscano. 26 gerações de tradição vinícola.', NULL),
('40000000-0000-0000-0000-000000000045', 'Castello Banfi',         '', '20000000-0000-0000-0000-000000000012', NULL, 'Essencial',      'Grande produtor de Montalcino. Brunello e Rosso di Montalcino acessíveis e consistentes.', NULL),

-- ── DOURO / PORTUGAL ────────────────────────────────────────
('40000000-0000-0000-0000-000000000051', 'Quinta do Crasto',       '', '20000000-0000-0000-0000-000000000021', NULL, 'Essencial',      'Vinhas velhas no Douro Superior. Crasto Superior e Vinha Maria Teresa são referências.', NULL),
('40000000-0000-0000-0000-000000000052', 'Niepoort',               '', '20000000-0000-0000-0000-000000000021', NULL, 'Fugir do óbvio', 'Dirk Niepoort reinventou o Douro seco com vinhos de precisão e tensão mineral.', NULL),
('40000000-0000-0000-0000-000000000053', 'Ramos Pinto',            '', '20000000-0000-0000-0000-000000000021', NULL, 'Essencial',      'Quinta da Ervamoira e Bom Retiro. Porto e vinhos secos com expressão única do Douro.', NULL),
('40000000-0000-0000-0000-000000000054', 'Quinta do Vale Meão',    '', '20000000-0000-0000-0000-000000000021', NULL, 'Ícones',         'Herdeira da antiga quinta do Barca Velha. Meão tinto é o vinho de culto do Douro.', NULL),

-- ── RIOJA / ESPANHA ─────────────────────────────────────────
('40000000-0000-0000-0000-000000000061', 'CVNE (Cune)',            '', '20000000-0000-0000-0000-000000000031', NULL, 'Essencial',      'Imperial Gran Reserva é um dos Riojas mais clássicos e consistentes do mercado.', NULL),
('40000000-0000-0000-0000-000000000062', 'Muga',                   '', '20000000-0000-0000-0000-000000000031', NULL, 'Fugir do óbvio', 'Torre Muga e Prado Enea: Rioja Alta com personalidade e envelhecimento exemplar.', NULL),
('40000000-0000-0000-0000-000000000063', 'Vega Sicilia',           '', '20000000-0000-0000-0000-000000000032', NULL, 'Ícones',         'Único é o vinho mais famoso da Espanha. Tempranillo envelhecido por décadas.', NULL),
('40000000-0000-0000-0000-000000000064', 'Dominio de Pingus',      '', '20000000-0000-0000-0000-000000000032', NULL, 'Ícones',         'Peter Sisseck criou o vinho mais escasso e cobiçado da Ribera del Duero.', NULL),

-- ── MENDOZA / ARGENTINA ─────────────────────────────────────
('40000000-0000-0000-0000-000000000071', 'Catena Zapata',          '', '20000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000022', 'Ícones',    'Nicolás Catena elevou o Malbec argentino ao patamar mundial. Adrianna Vineyard no topo.', NULL),
('40000000-0000-0000-0000-000000000072', 'Achaval Ferrer',         '', '20000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000021', 'Fugir do óbvio', 'Single-vineyard Malbecs de Finca Altamira e Mirador com profundidade rara.', NULL),
('40000000-0000-0000-0000-000000000073', 'Zuccardi',               '', '20000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000022', 'Essencial', 'Valle de Uco com foco em terroir. José Zuccardi entre os maiores vinicultores do mundo.', NULL),
('40000000-0000-0000-0000-000000000074', 'Clos de los Siete',      '', '20000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000022', 'Fugir do óbvio', 'Projeto de Michel Rolland no Vale do Uco. Blend de Malbec com complexidade e frescor.', NULL),

-- ── CHILE ───────────────────────────────────────────────────
('40000000-0000-0000-0000-000000000081', 'Concha y Toro',          '', '20000000-0000-0000-0000-000000000051', NULL, 'Essencial',      'Don Melchor e Almaviva: duas referências de classe mundial do Chile.', NULL),
('40000000-0000-0000-0000-000000000082', 'Almaviva',               '', '20000000-0000-0000-0000-000000000051', NULL, 'Ícones',         'Joint venture de Concha y Toro e Baron Philippe de Rothschild. O ícone chileno.', NULL),
('40000000-0000-0000-0000-000000000083', 'Montes',                 '', '20000000-0000-0000-0000-000000000053', NULL, 'Fugir do óbvio', 'Montes Alpha M e Folly de Syrah em Apalta estão entre os melhores da América do Sul.', NULL),
('40000000-0000-0000-0000-000000000084', 'Viña Vik',               '', '20000000-0000-0000-0000-000000000053', NULL, 'Ícones',         'Propriedade arquitetônica em Millahue. Vik e Milla Cala são joias de Colchagua.', NULL),

-- ── BRASIL ──────────────────────────────────────────────────
('40000000-0000-0000-0000-000000000091', 'Miolo',                  '', '20000000-0000-0000-0000-000000000061', NULL, 'Essencial',      'Maior referência do Brasil em espumantes e vinhos finos. Cuvée Giuseppe é o carro-chefe.', NULL),
('40000000-0000-0000-0000-000000000092', 'Casa Valduga',           '', '20000000-0000-0000-0000-000000000061', NULL, 'Essencial',      'Tradição familiar na Serra Gaúcha com espumantes premiados e tintos de altitude.', NULL),
('40000000-0000-0000-0000-000000000093', 'Pizzato',                '', '20000000-0000-0000-0000-000000000061', NULL, 'Fugir do óbvio', 'Foco em variedades italianas e Pinot Noir de qualidade crescente.', NULL),
('40000000-0000-0000-0000-000000000094', 'Cave Geisse',            '', '20000000-0000-0000-0000-000000000063', NULL, 'Ícones',         'Mario Geisse produz os espumantes mais precisos do Brasil no Planalto Catarinense.', NULL),
('40000000-0000-0000-0000-000000000095', 'Pericó',                 '', '20000000-0000-0000-0000-000000000062', NULL, 'Fugir do óbvio', 'Campanha Gaúcha com Tannat e Cabernet de grande personalidade e custo-benefício.', NULL),

-- ── NAPA VALLEY / EUA ───────────────────────────────────────
('40000000-0000-0000-0000-000000000101', 'Opus One',               '', '20000000-0000-0000-0000-000000000071', NULL, 'Ícones',         'Fruto da parceria entre Robert Mondavi e Baron Philippe de Rothschild. Um ícone americano.', NULL),
('40000000-0000-0000-0000-000000000102', 'Screaming Eagle',        '', '20000000-0000-0000-0000-000000000071', NULL, 'Ícones',         'O vinho mais escasso de Napa. Lista de espera de anos para apenas 500 caixas anuais.', NULL),
('40000000-0000-0000-0000-000000000103', 'Caymus Vineyards',       '', '20000000-0000-0000-0000-000000000071', NULL, 'Essencial',      'Special Selection Cabernet: exuberância de Napa em garrafa acessível para a categoria.', NULL),
('40000000-0000-0000-0000-000000000104', 'Ridge Vineyards',        '', '20000000-0000-0000-0000-000000000072', NULL, 'Fugir do óbvio', 'Monte Bello e Lytton Springs: o estilo californiano mais europeu e longevo.', NULL);
