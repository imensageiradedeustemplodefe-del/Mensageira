-- Encerramento programado de inscrições e contribuições (data e hora)
ALTER TABLE "events" ADD COLUMN "registrations_close_at" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "contributions_close_at" TIMESTAMP(3);
