-- Encerrar inscrições e/ou contribuições de um evento pelo painel
ALTER TABLE "events" ADD COLUMN "registrations_closed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "contributions_closed" BOOLEAN NOT NULL DEFAULT false;
