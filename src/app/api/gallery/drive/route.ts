import { prisma } from "@/lib/prisma";
import { handler, json, error } from "@/lib/api";

// Proxies the Google Apps Script gallery endpoint so the script URL stays server-side.
// Query: action=albums | album=<folderId>&pageSize=&order=&pageToken=
export const GET = handler(async (req) => {
  const setting = await prisma.siteSetting.findUnique({ where: { settingKey: "google_drive_script_url" } });
  const scriptUrl = setting?.settingValue?.trim();
  if (!scriptUrl) return json({ configured: false, albums: [], items: [], nextPageToken: null });

  const incoming = new URL(req.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ["action", "album", "pageSize", "order", "pageToken"]) {
    const v = incoming.get(key);
    if (v) params.set(key, v);
  }

  const res = await fetch(`${scriptUrl}?${params.toString()}`, { next: { revalidate: 300 } });
  if (!res.ok) return error("Erro ao buscar dados do Google Drive", 502);
  const data = await res.json();
  return json({ configured: true, ...data });
});
