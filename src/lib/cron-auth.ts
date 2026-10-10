import { timingSafeEqual } from "node:crypto";

function same(a: string | null | undefined, b: string | undefined) {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Cron da Vercel (Authorization: Bearer CRON_SECRET) ou agendador externo (Bearer/?key= CRON_EXTERNAL_KEY). */
export function isCronAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  const secret = process.env.CRON_SECRET?.trim();
  const external = process.env.CRON_EXTERNAL_KEY?.trim();
  return (
    (!!secret && same(auth, `Bearer ${secret}`)) ||
    (!!external && (same(auth, `Bearer ${external}`) || same(key, external)))
  );
}
