-- A pessoa avisou pelo site que fez o PIX (a equipe confere e marca como pago)
ALTER TABLE "event_registrations" ADD COLUMN "payment_reported_at" TIMESTAMP(3);
