-- ============================================================
-- SEED: Quiz questions + options
-- Depende de add_profile_quiz_system.sql já aplicado.
-- Popula os 3 fluxos completos (15 perguntas × 5 opções = 75 opções).
-- As perguntas ativas no onboarding são as 5 primeiras de cada
-- flow marcadas com active = true; o backoffice permite mudar.
-- ============================================================

-- ── FLUXO 1 — Situações do dia a dia ─────────────────────────
WITH q1 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('situacoes', 1, 'Em um jantar em casa, você...', 'Cenário: em casa', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Abro o que tiver, tanto faz', 'novato', 1 FROM q1
UNION ALL SELECT id, 'b', 'Peço ajuda pra escolher algo que combine', 'curioso', 2 FROM q1
UNION ALL SELECT id, 'c', 'Escolho algo de uma região que quero experimentar', 'desbravador', 3 FROM q1
UNION ALL SELECT id, 'd', 'Abro aquele rótulo que guardei pra ocasião certa', 'curador', 4 FROM q1
UNION ALL SELECT id, 'e', 'Decanto com antecedência e harmonizo com o menu', 'expert', 5 FROM q1;

WITH q2 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('situacoes', 2, 'No restaurante com amigos, a carta de vinhos chega. Você...', 'Cenário: restaurante / bar', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Peço "um tinto suave" ou o que o garçom indicar', 'novato', 1 FROM q2
UNION ALL SELECT id, 'b', 'Tento algo diferente do que já pedi antes', 'curioso', 2 FROM q2
UNION ALL SELECT id, 'c', 'Procuro regiões ou produtores que ainda não conheço', 'desbravador', 3 FROM q2
UNION ALL SELECT id, 'd', 'Já sei o que quero e comparo safras disponíveis', 'curador', 4 FROM q2
UNION ALL SELECT id, 'e', 'Converso com o sommelier sobre a adega do restaurante', 'expert', 5 FROM q2;

WITH q3 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('situacoes', 3, 'Numa viagem, sua relação com vinho é...', 'Cenário: viagem', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Se rolar degustação, topo — mas não é o foco', 'novato', 1 FROM q3
UNION ALL SELECT id, 'b', 'Visito uma vinícola se alguém sugerir', 'curioso', 2 FROM q3
UNION ALL SELECT id, 'c', 'Planejo a viagem incluindo vinícolas que quero conhecer', 'desbravador', 3 FROM q3
UNION ALL SELECT id, 'd', 'Organizo roteiro de enoturismo com visitas técnicas', 'curador', 4 FROM q3
UNION ALL SELECT id, 'e', 'Visito produtores específicos e converso sobre terroir e safra', 'expert', 5 FROM q3;

WITH q4 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('situacoes', 4, 'Quando você compra vinho...', 'Cenário: compra', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Escolho pelo rótulo bonito ou preço', 'novato', 1 FROM q4
UNION ALL SELECT id, 'b', 'Peço indicação ou sigo alguma lista', 'curioso', 2 FROM q4
UNION ALL SELECT id, 'c', 'Gosto de experimentar uvas e países diferentes', 'desbravador', 3 FROM q4
UNION ALL SELECT id, 'd', 'Tenho adega e compro com critério pra guardar', 'curador', 4 FROM q4
UNION ALL SELECT id, 'e', 'Compro direto de importadores ou vinícolas que conheço', 'expert', 5 FROM q4;

WITH q5 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('situacoes', 5, 'Se alguém pede uma dica de vinho, você...', 'Cenário: social / amigos', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Falo que não entendo muito', 'novato', 1 FROM q5
UNION ALL SELECT id, 'b', 'Indico o último que gostei', 'curioso', 2 FROM q5
UNION ALL SELECT id, 'c', 'Pergunto o que a pessoa curte e sugiro algo novo', 'desbravador', 3 FROM q5
UNION ALL SELECT id, 'd', 'Monto uma seleção baseada no gosto dela', 'curador', 4 FROM q5
UNION ALL SELECT id, 'e', 'Faço uma mini-aula sobre a região e o produtor', 'expert', 5 FROM q5;

-- ── FLUXO 2 — Hábitos e repertório ───────────────────────────
WITH q6 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('habitos', 1, 'Quando penso em abridor de vinho, eu...', 'Cenário: em casa / hábito', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Ainda não tenho um', 'novato', 1 FROM q6
UNION ALL SELECT id, 'b', 'Uso o saca-rolhas básico de casa', 'curioso', 2 FROM q6
UNION ALL SELECT id, 'c', 'Tenho meu abridor de dois tempos favorito', 'desbravador', 3 FROM q6
UNION ALL SELECT id, 'd', 'Tenho mais de um tipo, incluindo de lâmina', 'curador', 4 FROM q6
UNION ALL SELECT id, 'e', 'Tenho Ah-So, Coravin e abridor de champagne', 'expert', 5 FROM q6;

WITH q7 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('habitos', 2, 'Num happy hour com amigos, você...', 'Cenário: bar / amigos', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Peço cerveja ou drink — vinho só se alguém pedir', 'novato', 1 FROM q7
UNION ALL SELECT id, 'b', 'Peço uma taça do vinho da casa', 'curioso', 2 FROM q7
UNION ALL SELECT id, 'c', 'Sugiro ir a um bar com boa carta de vinhos', 'desbravador', 3 FROM q7
UNION ALL SELECT id, 'd', 'Levo uma garrafa que quero compartilhar', 'curador', 4 FROM q7
UNION ALL SELECT id, 'e', 'Organizo a noite com harmonização e rótulos selecionados', 'expert', 5 FROM q7;

WITH q8 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('habitos', 3, 'Sua "adega" hoje é...', 'Cenário: em casa / repertório', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Não tenho — compro na hora se precisar', 'novato', 1 FROM q8
UNION ALL SELECT id, 'b', 'Uma ou duas garrafas esquecidas na cozinha', 'curioso', 2 FROM q8
UNION ALL SELECT id, 'c', 'Um cantinho com 5 a 15 garrafas', 'desbravador', 3 FROM q8
UNION ALL SELECT id, 'd', 'Adega organizada por região e safra', 'curador', 4 FROM q8
UNION ALL SELECT id, 'e', 'Adega climatizada com controle e catálogo', 'expert', 5 FROM q8;

WITH q9 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('habitos', 4, 'Em uma degustação guiada, você...', 'Cenário: experiência / evento', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Nunca participei de uma', 'novato', 1 FROM q9
UNION ALL SELECT id, 'b', 'Já fui uma ou duas vezes, achei legal', 'curioso', 2 FROM q9
UNION ALL SELECT id, 'c', 'Participo quando posso e anoto o que gostei', 'desbravador', 3 FROM q9
UNION ALL SELECT id, 'd', 'Faço fichas de degustação e comparo notas', 'curador', 4 FROM q9
UNION ALL SELECT id, 'e', 'Conduzo degustações ou faço análise técnica', 'expert', 5 FROM q9;

WITH q10 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('habitos', 5, 'Se te dessem uma viagem pra qualquer região vinícola...', 'Cenário: viagem', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Qualquer lugar com paisagem bonita tá ótimo', 'novato', 1 FROM q10
UNION ALL SELECT id, 'b', 'Um lugar famoso tipo Mendoza ou Serra Gaúcha', 'curioso', 2 FROM q10
UNION ALL SELECT id, 'c', 'Um lugar que ainda não conheço — Douro, Toscana...', 'desbravador', 3 FROM q10
UNION ALL SELECT id, 'd', 'Montaria roteiro com produtores que acompanho', 'curador', 4 FROM q10
UNION ALL SELECT id, 'e', 'Direto pra uma sub-região rara — Barolo, Priorat...', 'expert', 5 FROM q10;

-- ── FLUXO 3 — Conexão emocional ──────────────────────────────
WITH q11 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('conexao', 1, 'O vinho na sua vida é...', 'Cenário: identidade', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Aparece de vez em quando, em datas especiais', 'novato', 1 FROM q11
UNION ALL SELECT id, 'b', 'Tô começando a curtir e quero saber mais', 'curioso', 2 FROM q11
UNION ALL SELECT id, 'c', 'Faz parte da minha rotina, adoro descobrir', 'desbravador', 3 FROM q11
UNION ALL SELECT id, 'd', 'É uma paixão — tenho história com cada garrafa', 'curador', 4 FROM q11
UNION ALL SELECT id, 'e', 'É estudo, cultura e estilo de vida', 'expert', 5 FROM q11;

WITH q12 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('conexao', 2, 'Num jantar de aniversário no restaurante, você...', 'Cenário: restaurante / ocasião', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Deixo o aniversariante ou garçom escolher', 'novato', 1 FROM q12
UNION ALL SELECT id, 'b', 'Dou uma olhada na carta e peço algo que pareça bom', 'curioso', 2 FROM q12
UNION ALL SELECT id, 'c', 'Pesquiso o restaurante antes pra ver a carta de vinhos', 'desbravador', 3 FROM q12
UNION ALL SELECT id, 'd', 'Ligo antes pra saber se posso levar um rótulo especial', 'curador', 4 FROM q12
UNION ALL SELECT id, 'e', 'Seleciono o vinho pensando na harmonização com o menu', 'expert', 5 FROM q12;

WITH q13 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('conexao', 3, 'Quando viajo e tem vinícola por perto...', 'Cenário: viagem', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Vou se o grupo quiser, mais pela paisagem', 'novato', 1 FROM q13
UNION ALL SELECT id, 'b', 'Aproveito pra conhecer e provar algo', 'curioso', 2 FROM q13
UNION ALL SELECT id, 'c', 'É parada obrigatória — já pesquisei antes', 'desbravador', 3 FROM q13
UNION ALL SELECT id, 'd', 'Agendo visitas técnicas e degustações especiais', 'curador', 4 FROM q13
UNION ALL SELECT id, 'e', 'Tenho contato prévio com o enólogo ou produtor', 'expert', 5 FROM q13;

WITH q14 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('conexao', 4, 'Seu registro de vinhos é...', 'Cenário: hábito pessoal', true)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', 'Não registro — tomo e esqueço', 'novato', 1 FROM q14
UNION ALL SELECT id, 'b', 'Tiro foto do rótulo de vez em quando', 'curioso', 2 FROM q14
UNION ALL SELECT id, 'c', 'Uso app pra registrar e avaliar', 'desbravador', 3 FROM q14
UNION ALL SELECT id, 'd', 'Tenho caderno ou planilha com notas detalhadas', 'curador', 4 FROM q14
UNION ALL SELECT id, 'e', 'Mantenho banco de dados com safras e evolução', 'expert', 5 FROM q14;

WITH q15 AS (
  INSERT INTO quiz_questions (flow, position, question, context, active)
  VALUES ('conexao', 5, 'Se pudesse definir sua relação com vinho em uma frase...', 'Cenário: autodefinição', false)
  RETURNING id
)
INSERT INTO quiz_options (question_id, letter, option_text, profile_key, weight) SELECT id, 'a', '"Tomo quando aparece e tá tudo bem"', 'novato', 1 FROM q15
UNION ALL SELECT id, 'b', '"Tô curioso e cada garrafa é uma surpresa"', 'curioso', 2 FROM q15
UNION ALL SELECT id, 'c', '"Cada vinho é uma viagem — e eu quero todas"', 'desbravador', 3 FROM q15
UNION ALL SELECT id, 'd', '"Minha história com vinho é pessoal e cheia de memórias"', 'curador', 4 FROM q15
UNION ALL SELECT id, 'e', '"Vinho é arte, ciência e cultura — e eu vivo isso"', 'expert', 5 FROM q15;
