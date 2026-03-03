-- WineGallery App - Seed Data
-- Run this AFTER 001_initial_schema.sql

-- ============================================================
-- COUNTRIES
-- ============================================================

INSERT INTO countries (id, name, image_url, description) VALUES
('france', 'França', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Berço do vinho mundial, terra das maiores appellations'),
('italy', 'Itália', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Tradição milenar e diversidade incomparável'),
('spain', 'Espanha', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Tempranillo e tradição centenária'),
('portugal', 'Portugal', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Uvas autóctones e tradição vinícola milenar'),
('usa', 'Estados Unidos', 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'O novo mundo em seu melhor'),
('argentina', 'Argentina', 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Malbec aos pés dos Andes')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- REGIONS
-- ============================================================

INSERT INTO regions (id, name, country_id, image_url, description) VALUES
('bordeaux', 'Bordeaux', 'france', 'https://images.unsplash.com/photo-1760372055346-6eeb72076946?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'A região mais prestigiada do mundo do vinho'),
('burgundy', 'Borgonha', 'france', 'https://images.unsplash.com/photo-1761125263490-2164c910c504?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'O terroir mais complexo e precioso do mundo'),
('champagne', 'Champagne', 'france', 'https://images.unsplash.com/photo-1666351028798-8920e510b705?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'A única e verdadeira terra do espumante'),
('rhone', 'Rhône', 'france', 'https://images.unsplash.com/photo-1723413516174-8a76575dccd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Syrah e Grenache em seu habitat natural'),
('tuscany', 'Toscana', 'italy', 'https://images.unsplash.com/photo-1760192686356-4b9777a9ceb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Terra do Chianti e Brunello di Montalcino'),
('piedmont', 'Piemonte', 'italy', 'https://images.unsplash.com/photo-1669667867723-1e5dd1e8fec5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Barolo e Barbaresco, os reis da Nebbiolo'),
('veneto', 'Vêneto', 'italy', 'https://images.unsplash.com/photo-1620421381420-e7fa4a041b15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Prosecco, Amarone e Valpolicella'),
('rioja', 'Rioja', 'spain', 'https://images.unsplash.com/photo-1678127107811-5572dc0dcf92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Tradição espanhola em cada garrafa'),
('priorat', 'Priorat', 'spain', 'https://images.unsplash.com/photo-1762926627606-74556c9b3b19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Vinhos de altitude em terraços históricos'),
('douro', 'Douro', 'portugal', 'https://images.unsplash.com/photo-1693825207674-ae2ef8269be5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Vale mágico do vinho do Porto'),
('alentejo', 'Alentejo', 'portugal', 'https://images.unsplash.com/photo-1603099464683-164113fa56d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Vinhos robustos do sul de Portugal'),
('napa', 'Napa Valley', 'usa', 'https://images.unsplash.com/photo-1656873593110-58a8b76823b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'O ápice do vinho californiano'),
('sonoma', 'Sonoma', 'usa', 'https://images.unsplash.com/photo-1594790632237-d42f61396acc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Diversidade e excelência californiana'),
('mendoza', 'Mendoza', 'argentina', 'https://images.unsplash.com/photo-1765850257541-b70e125323d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Capital mundial do Malbec')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BRANDS
-- ============================================================

INSERT INTO brands (id, name, description, image_url, country, region) VALUES
('dom-perignon', 'Dom Pérignon', 'O champagne mais icônico do mundo', 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'França', 'Champagne'),
('chateau-margaux', 'Château Margaux', 'Premier Cru Classé de elegância sublime', 'https://images.unsplash.com/photo-1697115355266-50d2a44366ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'França', 'Bordeaux'),
('opus-one', 'Opus One', 'Joint venture Mondavi-Rothschild', 'https://images.unsplash.com/photo-1676276629066-5a0c849a1591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'EUA', 'Napa Valley'),
('antinori', 'Antinori', '26 gerações produzindo vinho', 'https://images.unsplash.com/photo-1771846954643-6cf7a8dba814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Itália', 'Toscana'),
('catena-zapata', 'Catena Zapata', 'A família que elevou o Malbec argentino', 'https://images.unsplash.com/photo-1676276629066-5a0c849a1591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Argentina', 'Mendoza'),
('vega-sicilia', 'Vega Sicilia', 'O vinho mais prestigioso da Espanha', 'https://images.unsplash.com/photo-1697115355266-50d2a44366ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Espanha', 'Ribera del Duero')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GRAPES
-- ============================================================

INSERT INTO grapes (id, name, description, image_url, type, characteristics) VALUES
('cabernet-sauvignon', 'Cabernet Sauvignon', 'A uva tinta mais plantada do mundo', 'https://images.unsplash.com/photo-1607720336444-7990bedc2bf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'red', 'Corpo pleno, taninos robustos, notas de cassis e cedro'),
('pinot-noir', 'Pinot Noir', 'A uva mais elegante e sensível do mundo', 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'red', 'Corpo leve a médio, aromático, notas de frutas vermelhas'),
('merlot', 'Merlot', 'Suavidade e elegância em forma de uva', 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'red', 'Taninos macios, corpo médio, notas de ameixa e chocolate'),
('tempranillo', 'Tempranillo', 'A alma da Espanha', 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'red', 'Acidez média, taninos moderados, notas de couro e tabaco'),
('malbec', 'Malbec', 'O orgulho argentino', 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'red', 'Corpo pleno, taninos aveludados, notas de ameixa e violeta'),
('chardonnay', 'Chardonnay', 'A uva branca mais versátil', 'https://images.unsplash.com/photo-1664432786683-01c3d5a2c08b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'white', 'Corpo médio a pleno, notas de maçã, pêra e manteiga')
ON CONFLICT (id) DO NOTHING;
