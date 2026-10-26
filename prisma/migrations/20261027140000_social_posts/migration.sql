-- Calendário de posts das redes
CREATE TABLE "social_posts" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'feed',
    "status" TEXT NOT NULL DEFAULT 'planejado',
    "responsible" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_posts_date_idx" ON "social_posts"("date");
