-- Aparelho (assinatura de notificação) que deve ser avisado quando a equipe confirmar o pagamento
ALTER TABLE "event_registrations" ADD COLUMN "push_endpoint" TEXT;
