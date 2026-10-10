-- Como a pessoa vai pagar a contribuição: "pix" ou "cash" (dinheiro no dia)
ALTER TABLE "event_registrations" ADD COLUMN "payment_method" TEXT;
