-- Recebedor do PIX próprio do evento (em branco = PIX padrão da igreja, em Configurações)
ALTER TABLE "events" ADD COLUMN "pix_key" TEXT;
ALTER TABLE "events" ADD COLUMN "pix_name" TEXT;
ALTER TABLE "events" ADD COLUMN "pix_city" TEXT;
