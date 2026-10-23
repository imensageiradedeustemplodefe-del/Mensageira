-- Login do painel por nome de usuário e papéis por área (mídia, secretaria)
ALTER TYPE "AppRole" ADD VALUE IF NOT EXISTS 'midia';
ALTER TYPE "AppRole" ADD VALUE IF NOT EXISTS 'secretaria';

ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- usuários existentes: a parte do e-mail antes do @ (com número no fim se repetir)
UPDATE "users" u SET "username" = s.base || CASE WHEN s.n > 1 THEN s.n::text ELSE '' END
FROM (
  SELECT "id", lower(split_part("email", '@', 1)) AS base,
         row_number() OVER (PARTITION BY lower(split_part("email", '@', 1)) ORDER BY "created_at") AS n
  FROM "users"
) s
WHERE u."id" = s."id";

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
