-- Publicação das artes no Facebook e no Instagram (na hora ou agendada)
CREATE TABLE "social_publications" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'feed',
    "images" TEXT[],
    "caption" TEXT NOT NULL DEFAULT '',
    "networks" TEXT[],
    "publish_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "result" TEXT,
    "published_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_publications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_publications_status_publish_at_idx" ON "social_publications"("status", "publish_at");
