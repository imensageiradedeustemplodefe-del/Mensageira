# Mensageira de Deus – Templo de Fé

Site/app da Igreja Mensageira de Deus Templo de Fé, reconstruído fora do Lovable.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui (Radix) · Prisma 7 + Postgres · Auth.js v5 · web-push · Vercel.

## Rodando localmente

Pré-requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env        # preencha as variáveis (veja abaixo)
npx prisma dev --detach     # (opcional) Postgres local do Prisma; use a URL impressa em DATABASE_URL
npx prisma migrate dev      # cria as tabelas
npx prisma db seed          # admin inicial, configurações, versículos, modelos de evento
npm run dev                 # http://localhost:3000
```

Painel administrativo: `/admin/login` (usuário/senha do seed: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão Postgres (Prisma Postgres / Vercel Postgres). |
| `AUTH_SECRET` | Segredo do Auth.js — `openssl rand -base64 32`. |
| `AUTH_TRUST_HOST` | `true` na Vercel. |
| `CONTACT_ENCRYPTION_KEY` | Chave (32+ caracteres) que criptografa e-mail/telefone dos pedidos de oração. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push — `npx web-push generate-vapid-keys`. |
| `CRON_SECRET` | Protege `/api/cron/daily` (a Vercel envia `Authorization: Bearer <CRON_SECRET>`). |
| `NEXT_PUBLIC_SITE_URL` | URL pública (para metadata/OG). |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin criado pelo seed. |

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Em **Storage**, crie um banco **Prisma Postgres** (ou Neon) e conecte ao projeto — isso define `DATABASE_URL`.
3. Configure as demais variáveis de ambiente acima.
4. Após o primeiro deploy, rode as migrations e o seed contra o banco de produção (uma vez):
   ```bash
   DATABASE_URL="<url de produção>" npx prisma migrate deploy
   DATABASE_URL="<url de produção>" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npx prisma db seed
   ```
   Alternativa: defina o *Build Command* como `prisma migrate deploy && next build` para migrar a cada deploy.
5. O cron de notificações (`vercel.json`) roda diariamente às 10h UTC (7h em Brasília).

## Integrações Google

- **Galeria** e **inscrições em eventos** usam Google Apps Script (mesmos scripts do projeto original).
  Cole as URLs em **Admin → Sistema → Configurações → Integrações Google** (ou em **Google Drive**).
- O script de inscrições está em `google-apps-script/EventRegistrations.gs`.

## Estrutura

```
prisma/            schema, migrations e seed
src/app/(public)   páginas públicas (layout com header, bottom nav, player)
src/app/admin      painel administrativo
src/app/api        rotas JSON (públicas em /api/*, admin em /api/admin/*)
src/components     UI (shadcn em ui/, páginas em pages/, admin em admin/)
src/lib            prisma, auth, push, crypto, sheets, helpers de API
public/sw.js       service worker (PWA + push)
```
