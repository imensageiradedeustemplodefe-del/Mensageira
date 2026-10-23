-- Secretaria: cadastro de membros e certificados emitidos
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "birth_date" DATE,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "baptism_date" DATE,
    "member_since" DATE,
    "role" TEXT NOT NULL DEFAULT 'Membro',
    "groups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "worker" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "photo" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "members_number_key" ON "members"("number");
CREATE INDEX "members_status_idx" ON "members"("status");

CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "member_id" UUID,
    "recipient_name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificates_year_number_key" ON "certificates"("year", "number");
CREATE INDEX "certificates_type_idx" ON "certificates"("type");

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
