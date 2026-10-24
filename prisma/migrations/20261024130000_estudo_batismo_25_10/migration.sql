-- Estudo para o batismo: domingo 25/10/2026, às 14h00 (Brasília), na igreja.
-- event_date fica em UTC (14h00 -03:00 = 17h00 UTC). Não duplica se já existir no mesmo dia.
INSERT INTO "events" ("id", "title", "description", "event_date", "location", "category", "is_published", "created_at", "updated_at")
SELECT gen_random_uuid(),
       'Estudo para o Batismo',
       'Estudo bíblico de preparação para o batismo. Se você deseja se batizar, participe!',
       '2026-10-25 17:00:00',
       'Igreja Mensageira de Deus Templo de Fé',
       'batismo',
       true,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "events"
  WHERE "title" = 'Estudo para o Batismo'
    AND "event_date" >= '2026-10-25 03:00:00' AND "event_date" < '2026-10-26 03:00:00'
);
