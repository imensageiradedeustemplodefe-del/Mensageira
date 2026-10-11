-- Outubro/2026 fugiu da programação fixa: o Louvorzão dos Jovens foi no sábado 10/10 (no lugar da
-- Preparação para Santa Ceia) e no sábado 03/10 não teve evento. Corrige os eventos gerados para o mês.
-- event_date fica em UTC; os intervalos abaixo cobrem o dia inteiro no horário de Brasília (-03:00).

-- 10/10: não teve Preparação para Santa Ceia
DELETE FROM "events"
WHERE "title" = 'Preparação para Santa Ceia'
  AND "event_date" >= '2026-10-10 03:00:00' AND "event_date" < '2026-10-11 03:00:00';

-- Louvorzão de 03/10 passa para 10/10, no mesmo horário
UPDATE "events"
SET "event_date" = "event_date" + INTERVAL '7 days', "updated_at" = CURRENT_TIMESTAMP
WHERE "title" = 'Louvorzão dos Jovens'
  AND "event_date" >= '2026-10-03 03:00:00' AND "event_date" < '2026-10-04 03:00:00';
