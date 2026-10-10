import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";
import { fetchAppsScript } from "@/lib/apps-script";

// O Apps Script pode levar dezenas de segundos para listar pastas grandes
export const maxDuration = 60;

// Proxies the Google Apps Script gallery endpoint so the script URL stays server-side.
// Query: action=albums | album=<folderId>&pageSize=&order=&pageToken=
export const GET = handler(async (req) => {
  const setting = await prisma.siteSetting.findUnique({ where: { settingKey: "google_drive_script_url" } });
  const scriptUrl = setting?.settingValue?.trim();
  if (!scriptUrl) return json({ configured: false, albums: [], items: [], nextPageToken: null });

  const incoming = new URL(req.url).searchParams;
  const params = new URLSearchParams();
  const rules: Record<string, RegExp> = {
    action: /^albums$/,
    album: /^[A-Za-z0-9_-]{10,100}$/,
    pageSize: /^\d{1,3}$/,
    order: /^(asc|desc|newest|oldest|name)$/,
    pageToken: /^[A-Za-z0-9_\-.~=+/]{1,500}$/,
  };
  for (const [key, re] of Object.entries(rules)) {
    const v = incoming.get(key);
    if (!v) continue;
    if (!re.test(v)) return error(`Parâmetro inválido: ${key}`);
    params.set(key, v);
  }

  const res = await fetchAppsScript(`${scriptUrl}?${params.toString()}`, { cache: undefined, next: { revalidate: 3600 } });
  if (!res.ok) return error("Erro ao buscar dados do Google Drive", 502);
  const data = await res.json();
  return json({ configured: true, ...data });
});
