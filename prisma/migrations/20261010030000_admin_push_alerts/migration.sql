-- Aparelhos da equipe que recebem avisos do painel (novas inscrições, PIX informado)
ALTER TABLE "push_subscriptions" ADD COLUMN "notify_admin" BOOLEAN NOT NULL DEFAULT false;
