-- Modelos de arte salvos no gerador do painel
CREATE TABLE "art_presets" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "art_presets_pkey" PRIMARY KEY ("id")
);
