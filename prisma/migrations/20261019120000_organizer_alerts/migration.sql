-- Avisos para os celulares das organizadoras (nova inscrição / PIX informado), por evento
CREATE TABLE "organizer_alerts" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizer_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizer_alerts_event_id_subscription_id_key" ON "organizer_alerts"("event_id", "subscription_id");

ALTER TABLE "organizer_alerts" ADD CONSTRAINT "organizer_alerts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organizer_alerts" ADD CONSTRAINT "organizer_alerts_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "push_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
