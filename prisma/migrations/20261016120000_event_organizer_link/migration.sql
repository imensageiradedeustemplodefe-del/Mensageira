-- Link das organizadoras: código secreto por evento para ver os inscritos e pagamentos sem acesso ao painel
ALTER TABLE "events" ADD COLUMN "organizer_token" TEXT;
CREATE UNIQUE INDEX "events_organizer_token_key" ON "events"("organizer_token");
