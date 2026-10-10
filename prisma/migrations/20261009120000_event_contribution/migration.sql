-- Contribuição (PIX) nos eventos com inscrição
ALTER TABLE "events" ADD COLUMN "contribution_cents" INTEGER;
ALTER TABLE "events" ADD COLUMN "contribution_note" TEXT;
ALTER TABLE "event_registrations" ADD COLUMN "contribution_paid" BOOLEAN NOT NULL DEFAULT false;
