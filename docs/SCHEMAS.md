# Wine Gallery — Schemas do Banco de Dados

> **Documento de referência para criação e importação de conteúdo.**
> Gerado em: 2026-04-23 · Projeto Supabase: `hdnbnkcoyeehjhrqcuyi`

---

## Sumário

1. [Tipos Enumerados (Enums)](#1-tipos-enumerados-enums)
2. [Hierarquia de Regiões](#2-regiões--regions)
3. [Vinícolas](#3-vinícolas--wineries)
4. [Vinhos](#4-vinhos--wines)
5. [Uvas](#5-uvas--grapes)
6. [Relação Vinho-Uva](#6-relação-vinho-uva--wine_grapes)
7. [Experiências](#7-experiências--experiences)
8. [Lugares](#8-lugares--places)
9. [Coleções](#9-coleções--collections)
10. [Itens de Coleção](#10-itens-de-coleção--collection_items)
11. [Irmandades](#11-irmandades--brotherhoods)
12. [Destaques (Home)](#12-destaques-home--highlights)
13. [Quiz — Perguntas e Opções](#13-quiz--quiz_questions--quiz_options)
14. [Perfis de Vinho](#14-perfis-de-vinho--wine_profiles)
15. [Regras de Conteúdo por Perfil](#15-regras-de-conteúdo-por-perfil--profile_content_rules)
16. [Relacionamentos entre tabelas](#16-relacionamentos-entre-tabelas)

---

## 1. Tipos Enumerados (Enums)

### `wine_profile_type` — Perfil de preferência do usuário
Usado em: `user_profiles.wine_profile`, `wines.profile_affinity`, `wineries.profile_affinity`, `collections.profile_affinity`, `experiences.profile_affinity`, `quiz_options.profile_key`

| Valor | Descrição |
|-------|-----------|
| `novato` | Iniciante no mundo do vinho |
| `curioso` | Explora com interesse crescente |
| `desbravador` | Aventureiro, gosta de novidades |
| `curador` | Seleciona com critério |
| `expert` | Conhecimento avançado |

---

### `user_level_type` — Nível do usuário no app
Usado em: `user_profiles.user_level`

| Valor | Nível |
|-------|-------|
| `recem_chegado` | Nível 1 (iniciante) |
| `em_ascensao` | Nível 2 |
| `destaque` | Nível 3 |
| `embaixador` | Nível 4 (máximo) |

---

### `points_action_type` — Tipos de ação para pontos
Usado em: `user_points_log.action_type`

| Valor | Ação |
|-------|------|
| `tried` | Marcou como experimentado |
| `favorite` | Marcou como favorito |
| `review` | Escreveu avaliação |
| `photo` | Enviou foto |
| `brotherhood_join` | Entrou em irmandade |
| `follow` | Seguiu vinícola |

---

### `user_app_type` — Tipo de acesso do usuário
Usado em: `user_profiles.user_type`

| Valor | Permissão |
|-------|-----------|
| `normal` | Usuário comum |
| `admin` | Administrador |

---

## 2. Regiões — `regions`

Tabela hierárquica que representa países, regiões e sub-regiões. Auto-referenciada via `parent_id`.

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | varchar(255) | NÃO | — | Nome da região |
| `parent_id` | uuid | SIM | — | FK → `regions.id` (região pai) |
| `level` | varchar(20) | NÃO | — | Nível hierárquico |
| `photo` | text | SIM | — | URL da imagem |
| `description` | text | SIM | — | Texto descritivo |
| `created_at` | timestamptz | SIM | `now()` | Data de criação |
| `updated_at` | timestamptz | SIM | `now()` | Data de atualização |

**Valores válidos para `level`:**
| Valor | Uso |
|-------|-----|
| `country` | País (ex: Brasil, França, Itália) — `parent_id` = NULL |
| `region` | Região vinícola (ex: Serra Gaúcha) — `parent_id` = id do país |
| `sub-region` | Sub-região (ex: Vale dos Vinhedos) — `parent_id` = id da região |

**Dicas de importação:**
- Sempre crie países antes de regiões, e regiões antes de sub-regiões.
- `photo` deve ser uma URL pública direta (Unsplash, Supabase Storage, etc.).
- `description` é exibida na tela de detalhe — escreva 2 a 4 parágrafos.

---

## 3. Vinícolas — `wineries`

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | varchar(255) | NÃO | — | Nome da vinícola |
| `photo` | text | NÃO | — | URL da imagem de capa |
| `region_id` | uuid | NÃO | — | FK → `regions.id` (região principal) |
| `sub_region_id` | uuid | SIM | — | FK → `regions.id` (sub-região, opcional) |
| `category` | varchar(50) | NÃO | — | Categoria/rótulo da vinícola |
| `highlight` | text | NÃO | — | Texto de destaque (exibido no card) |
| `buy_link` | text | SIM | — | URL para site/compra |
| `profile_affinity` | wine_profile_type | SIM | — | Perfil de usuário com maior afinidade |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Valores sugeridos para `category`:**
Texto livre (max 50 chars). Exemplos: `Boutique`, `Familiar`, `Orgânica`, `Espumantes`, `Premiada`.

**Dicas de importação:**
- `region_id` é obrigatório — a vinícola precisa estar vinculada a uma região existente.
- `highlight` é o "por que visitar" — escreva 1 a 3 frases impactantes.
- `profile_affinity` é opcional mas melhora a curadoria personalizada por perfil.

---

## 4. Vinhos — `wines`

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | varchar(255) | NÃO | — | Nome do vinho |
| `photo` | text | NÃO | — | URL da imagem (rótulo/garrafa) |
| `winery_id` | uuid | NÃO | — | FK → `wineries.id` |
| `category` | varchar(50) | NÃO | — | Categoria do vinho |
| `type` | varchar(50) | NÃO | — | Tipo (tinto, branco, etc.) |
| `method` | varchar(255) | SIM | — | Método de produção |
| `highlight` | text | NÃO | — | Texto de destaque (exibido no card) |
| `pairing` | text | SIM | — | Harmonizações recomendadas |
| `tasting_note` | text | SIM | — | Notas de degustação |
| `average_price` | numeric | SIM | — | Preço médio (referência) |
| `price_min` | numeric | SIM | — | Preço mínimo encontrado |
| `price_max` | numeric | SIM | — | Preço máximo encontrado |
| `alcohol_pct` | numeric | SIM | — | Teor alcoólico (%) |
| `buy_link` | text | SIM | — | URL para compra |
| `profile_affinity` | wine_profile_type | SIM | — | Perfil com maior afinidade |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Valores sugeridos para `category`:**
Texto livre (max 50 chars). Exemplos: `Reserva`, `Gran Reserva`, `Safra Limitada`, `Orgânico`, `Espumante Natural`.

**Valores sugeridos para `type`:**
Texto livre (max 50 chars). Exemplos: `Tinto`, `Branco`, `Rosé`, `Espumante`, `Laranja`, `Sobremesa`, `Pétillant Naturel`.

**Dicas de importação:**
- `winery_id` é obrigatório — o vinho deve pertencer a uma vinícola existente.
- `photo` idealmente mostra a garrafa ou rótulo de frente, fundo claro.
- `highlight` é exibido no card de listagem — 1 a 2 frases.
- `tasting_note` é exibida na tela de detalhe — pode ser mais longa (3 a 5 frases).
- Preços em BRL (reais). Use `average_price` como campo principal se não tiver min/max.
- Após inserir vinhos, adicione as uvas em `wine_grapes`.

---

## 5. Uvas — `grapes`

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | varchar(255) | NÃO | — | Nome da uva |
| `type` | varchar(50) | NÃO | — | Tipo da uva |
| `description` | text | SIM | — | Descrição da casta |
| `photo` | text | SIM | — | URL da imagem |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Valores para `type`:**
Texto livre. Sugeridos: `tinta`, `branca`, `rosada`.

**Dicas de importação:**
- Verifique se a uva já existe antes de inserir (evitar duplicatas).
- `description` é usada em possíveis telas educativas — explique o perfil sensorial da casta.

---

## 6. Relação Vinho-Uva — `wine_grapes`

Tabela de junção N:N entre `wines` e `grapes`. Sem PK própria, sem campos extras.

| Coluna | Tipo | Nulo | Descrição |
|--------|------|------|-----------|
| `wine_id` | uuid | NÃO | FK → `wines.id` |
| `grape_id` | uuid | NÃO | FK → `grapes.id` |

**Dicas de importação:**
- Um vinho pode ter múltiplas uvas (assemblage).
- Insira uma linha por uva que compõe o vinho.

---

## 7. Experiências — `experiences`

Experiências de visitação, eventos, acessórios, cursos — qualquer conteúdo além de vinhos e locais.

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | varchar(255) | NÃO | — | Nome da experiência |
| `photo` | text | NÃO | — | URL da imagem de capa |
| `category` | varchar(50) | NÃO | — | Categoria da experiência |
| `winery_id` | uuid | SIM | — | FK → `wineries.id` (NULL = experiência avulsa) |
| `region_id` | uuid | SIM | — | FK → `regions.id` |
| `highlight` | text | NÃO | — | Texto "por que viver" (tela de detalhe) |
| `buy_link` | text | SIM | — | URL para compra/reserva/mais info |
| `location_type` | varchar(30) | NÃO | `'na_vinicola'` | Tipo de local |
| `profile_affinity` | wine_profile_type | SIM | — | Perfil com maior afinidade |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Valores para `location_type`:**
| Valor | Quando usar |
|-------|-------------|
| `na_vinicola` | Experiência que ocorre dentro de uma vinícola |
| `online` | Curso, degustação ou evento online |
| `externo` | Local fora de vinícola (festival, loja, etc.) |
| `acessorio` | Produto/acessório (não é um evento físico) |

**Tipos de experiências — valores sugeridos para `category`:**
Texto livre (max 50 chars). Exemplos: `Visita Guiada`, `Degustação`, `Curso`, `Enoturismo`, `Acessório`, `Experiência Gourmet`, `Festival`, `Harmonização`.

**Lógica de exibição:**
- `winery_id = NULL` → aparece na seção "Experiências & Acessórios" da tela Explorar
- `winery_id preenchido` → aparece na aba Experiências da tela da vinícola

**Dicas de importação:**
- Use `winery_id = NULL` para produtos avulsos (ex: taças, cursos online, apps de vinho).
- `highlight` é o campo principal de descrição — escreva 2 a 5 frases envolventes.
- `buy_link` pode ser link de reserva, site da vinícola ou e-commerce.

---

## 8. Lugares — `places`

Restaurantes, adegas, empórios, hotéis e qualquer estabelecimento relacionado ao enoturismo.

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | text | NÃO | — | Nome do lugar |
| `photo` | text | SIM | — | URL da imagem |
| `description` | text | SIM | — | Descrição completa |
| `highlight` | text | SIM | — | Texto de destaque |
| `region_id` | uuid | SIM | — | FK → `regions.id` |
| `sub_region_id` | uuid | SIM | — | FK → `regions.id` |
| `type` | text | NÃO | `'restaurant'` | Tipo principal |
| `sub_type` | text | SIM | — | Subtipo (detalhamento) |
| `website` | text | SIM | — | URL do site |
| `address` | text | SIM | — | Endereço completo |
| `price_range` | text | SIM | — | Faixa de preço |
| `created_at` | timestamptz | SIM | `now()` | — |

**Valores para `type`:**
Texto livre. Exemplos: `restaurant`, `wine_bar`, `shop`, `hotel`, `cave`, `market`.

**Valores para `sub_type`:**
Texto livre. Exemplos: `italiano`, `contemporâneo`, `natural wines`, `boutique hotel`.

**Valores para `price_range`:**
Texto livre. Exemplos: `$`, `$$`, `$$$`, `$$$$` ou `R$ 50–150 por pessoa`.

**Dicas de importação:**
- `region_id` vincula o lugar à navegação por região.
- `address` completo ajuda o usuário a encontrar o local.

---

## 9. Coleções — `collections`

Curadoria editorial de vinhos, vinícolas ou outros itens. Exibida na tela Explorar.

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `title` | varchar(255) | NÃO | — | Título da coleção |
| `photo` | text | NÃO | — | URL da imagem de capa |
| `tagline` | text | NÃO | — | Subtítulo/frase de impacto |
| `category` | varchar(50) | NÃO | — | Categoria editorial |
| `content_type` | varchar(50) | NÃO | — | Tipo de conteúdo dos itens |
| `country_id` | uuid | SIM | — | FK → `regions.id` (nível country) |
| `region_id` | uuid | SIM | — | FK → `regions.id` (nível region) |
| `sub_region_id` | uuid | SIM | — | FK → `regions.id` (nível sub-region) |
| `is_mixed` | boolean | SIM | `false` | Coleção mista (múltiplos tipos) |
| `profile_affinity` | wine_profile_type | SIM | — | Perfil com maior afinidade |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Valores para `content_type`:**
| Valor | Descrição |
|-------|-----------|
| `wine` | Coleção de vinhos |
| `winery` | Coleção de vinícolas |
| `experience` | Coleção de experiências |
| `place` | Coleção de lugares |
| `mixed` | Mista (usar com `is_mixed = true`) |

**Valores sugeridos para `category`:**
Texto livre. Exemplos: `Destaque`, `Temporada`, `Por Perfil`, `Regional`, `Temático`, `Iniciantes`.

**Dicas de importação:**
- Após criar a coleção, adicione os itens em `collection_items`.
- Use `profile_affinity` para aparecer em destaque para o perfil certo.
- Os campos de região são opcionais — preenchê-los melhora filtros futuros.

---

## 10. Itens de Coleção — `collection_items`

Tabela de junção entre coleções e seus itens. Item é polimórfico (pode ser wine, winery, etc.).

| Coluna | Tipo | Nulo | Descrição |
|--------|------|------|-----------|
| `collection_id` | uuid | NÃO | FK → `collections.id` |
| `item_id` | uuid | NÃO | UUID do item referenciado |
| `item_type` | varchar(50) | NÃO | Tipo do item |
| `position` | integer | NÃO | Ordem de exibição (começa em 1) |

**Valores para `item_type`:**
| Valor | Tabela de origem |
|-------|-----------------|
| `wine` | `wines` |
| `winery` | `wineries` |
| `experience` | `experiences` |
| `place` | `places` |

**Dicas de importação:**
- `position` define a ordem dos itens dentro da coleção. Use 1, 2, 3…
- O `item_id` deve existir na tabela correspondente ao `item_type`.
- Não há FK declarada para `item_id` (é polimórfico) — garantir consistência manualmente.

---

## 11. Irmandades — `brotherhoods`

Grupos temáticos de amantes de vinho (irmandades gastronômicas/culturais).

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `name` | varchar(255) | NÃO | — | Nome da irmandade |
| `photo` | text | NÃO | — | URL da imagem de capa |
| `region_id` | uuid | SIM | — | FK → `regions.id` |
| `description` | text | NÃO | — | Descrição completa |
| `highlight` | text | NÃO | — | Texto de destaque (card) |
| `website` | text | SIM | — | URL do site oficial |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Dicas de importação:**
- `description` é exibida na tela de detalhe — escreva 3 a 6 frases sobre a história/missão.
- `highlight` é o que aparece no card de listagem — 1 a 2 frases de impacto.

---

## 12. Destaques Home — `highlights`

Controla o carrossel/destaques da tela inicial. Aponta para qualquer entidade via `entity_id`.

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `type` | text | NÃO | — | Tipo de entidade destacada |
| `entity_id` | uuid | NÃO | — | UUID da entidade (winery, wine, etc.) |
| `label` | text | SIM | — | Rótulo/badge exibido sobre o card |
| `position` | integer | NÃO | `0` | Ordem de exibição |
| `active` | boolean | NÃO | `true` | Se está ativo no app |
| `created_at` | timestamptz | SIM | `now()` | — |

**Valores para `type`:**
| Valor | Tabela de origem |
|-------|-----------------|
| `winery` | `wineries` |
| `wine` | `wines` |
| `collection` | `collections` |
| `experience` | `experiences` |
| `region` | `regions` |

**Dicas de importação:**
- `position` determina a ordem no carrossel (menor = aparece primeiro).
- `label` é opcional — use para badges como `Novo`, `Em destaque`, `Temporada`.
- `active = false` desativa o destaque sem removê-lo.

---

## 13. Quiz — `quiz_questions` & `quiz_options`

### `quiz_questions` — Perguntas do quiz de perfil

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `position` | integer | NÃO | `0` | Ordem no quiz |
| `question` | text | NÃO | — | Texto da pergunta |
| `context` | text | SIM | — | Subtítulo/contexto (exibido acima da pergunta) |
| `active` | boolean | NÃO | `true` | Se a pergunta está ativa |
| `bonus_points` | integer | NÃO | `0` | Pontos bônus (0 = pergunta do quiz principal) |
| `created_at` | timestamptz | SIM | `now()` | — |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Lógica de `bonus_points`:**
- `bonus_points = 0` → pergunta do quiz principal (onboarding)
- `bonus_points > 0` → pergunta do quiz bônus (rota `/quiz-bonus`)

---

### `quiz_options` — Opções de resposta

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `question_id` | uuid | NÃO | — | FK → `quiz_questions.id` |
| `letter` | char(1) | NÃO | — | Letra da opção (A, B, C, D…) |
| `option_text` | text | NÃO | — | Texto da opção |
| `profile_key` | wine_profile_type | NÃO | — | Perfil que esta opção representa |
| `created_at` | timestamptz | SIM | `now()` | — |

**Dicas de importação:**
- Cada pergunta deve ter 3 a 5 opções.
- `letter` deve ser único por pergunta: A, B, C, D, E.
- `profile_key` define como a resposta influencia o perfil final — distribua os perfis equilibradamente.
- Para quiz bônus: cada pergunta pode ter pontos diferentes (`bonus_points` entre 5 e 50).

---

## 14. Perfis de Vinho — `wine_profiles`

Tabela de configuração dos perfis de usuário (conteúdo editorial de cada perfil).

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | text | NÃO | — | Chave primária (= valor do enum: novato, curioso…) |
| `label` | text | SIM | — | Nome exibido (ex: "Novato") |
| `archetype` | text | SIM | — | Arquétipo narrativo (ex: "O Curioso Aventureiro") |
| `tagline` | text | SIM | — | Frase curta de identidade |
| `emoji` | text | SIM | — | Emoji representativo |
| `description` | text | SIM | — | Descrição completa do perfil |
| `order_index` | integer | NÃO | `1` | Ordem de exibição |
| `updated_at` | timestamptz | SIM | `now()` | — |

---

## 15. Regras de Conteúdo por Perfil — `profile_content_rules`

Define quais categorias de conteúdo são exibidas (e com qual prioridade) para cada perfil.

| Coluna | Tipo | Nulo | Padrão | Descrição |
|--------|------|------|--------|-----------|
| `id` | uuid | NÃO | `gen_random_uuid()` | Chave primária |
| `profile` | text | NÃO | — | Perfil alvo (ex: `novato`) |
| `category` | text | NÃO | — | Categoria de conteúdo |
| `priority` | integer | NÃO | `1` | Prioridade (1 = mais alta) |
| `visible` | boolean | NÃO | `true` | Se aparece para este perfil |
| `updated_at` | timestamptz | SIM | `now()` | — |

**Restrição:** `UNIQUE (profile, category)` — uma regra por combinação perfil+categoria.

---

## 16. Relacionamentos entre tabelas

```
regions ─────────────────┬──< wineries.region_id
         (self-join) ────┘    wineries.sub_region_id
                              collections.country_id
                              collections.region_id
                              collections.sub_region_id
                              experiences.region_id
                              places.region_id
                              places.sub_region_id
                              brotherhoods.region_id

wineries ────────────────┬──< wines.winery_id
                         └──< experiences.winery_id
                              winery_follows.winery_id

wines ───────────────────┬──< wine_grapes.wine_id
                         └──< user_cellar.wine_id

grapes ──────────────────└──< wine_grapes.grape_id

collections ─────────────└──< collection_items.collection_id

quiz_questions ──────────└──< quiz_options.question_id
                              quiz_bonus_answers.question_id
```

---

## Guia rápido de importação por entidade

| Entidade | Obrigatórios | Opcionais importantes |
|----------|-------------|----------------------|
| **Região (país)** | `name`, `level='country'` | `photo`, `description` |
| **Região (região)** | `name`, `level='region'`, `parent_id` | `photo`, `description` |
| **Região (sub-região)** | `name`, `level='sub-region'`, `parent_id` | `photo` |
| **Vinícola** | `name`, `photo`, `region_id`, `category`, `highlight` | `sub_region_id`, `buy_link`, `profile_affinity` |
| **Vinho** | `name`, `photo`, `winery_id`, `category`, `type`, `highlight` | `tasting_note`, `pairing`, `average_price`, `buy_link`, `profile_affinity` |
| **Uva** | `name`, `type` | `description`, `photo` |
| **Vinho-Uva** | `wine_id`, `grape_id` | — |
| **Experiência (vinícola)** | `name`, `photo`, `category`, `highlight`, `winery_id` | `region_id`, `buy_link`, `location_type` |
| **Experiência (avulsa)** | `name`, `photo`, `category`, `highlight` | `buy_link`, `location_type='acessorio'` |
| **Lugar** | `name`, `type` | `photo`, `description`, `region_id`, `address`, `website` |
| **Coleção** | `title`, `photo`, `tagline`, `category`, `content_type` | `profile_affinity`, região |
| **Item de Coleção** | `collection_id`, `item_id`, `item_type`, `position` | — |
| **Irmandade** | `name`, `photo`, `description`, `highlight` | `region_id`, `website` |
| **Destaque** | `type`, `entity_id`, `position` | `label`, `active` |
| **Quiz Pergunta** | `question`, `position` | `context`, `bonus_points` |
| **Quiz Opção** | `question_id`, `letter`, `option_text`, `profile_key` | — |

---

*Documento gerado automaticamente a partir do schema do Supabase — projeto `hdnbnkcoyeehjhrqcuyi`.*
