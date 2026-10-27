-- Inscrições de push vencidas (o serviço respondeu 404/410): o aparelho troca por uma nova sozinho
ALTER TABLE "push_subscriptions" ADD COLUMN "expired_at" TIMESTAMP(3);

-- As que já estão inativas venceram (quem desativa pelo site também apaga a inscrição do navegador,
-- então nunca volta com o endereço antigo)
UPDATE "push_subscriptions" SET "expired_at" = "updated_at" WHERE "is_active" = false;
