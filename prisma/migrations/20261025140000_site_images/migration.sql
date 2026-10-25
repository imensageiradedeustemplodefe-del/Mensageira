-- Imagens do conteúdo do site enviadas pelo painel (fotos dos pastores etc.)
CREATE TABLE "site_images" (
    "id" UUID NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_images_pkey" PRIMARY KEY ("id")
);

-- Configurações antigas que o site não usava mais (os textos e os pastores agora ficam em Conteúdo do site)
DELETE FROM "site_settings" WHERE "setting_key" IN (
  'hero_title', 'hero_subtitle', 'hero_description', 'pastor_name',
  'pastor_principal_name', 'pastor_principal_description', 'pastora_name', 'pastora_description',
  'pastor_auxiliar_name', 'pastor_auxiliar_description'
);
