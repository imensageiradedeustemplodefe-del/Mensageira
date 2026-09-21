-- CreateTable
CREATE TABLE "push_logs" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_logs_pkey" PRIMARY KEY ("id")
);
