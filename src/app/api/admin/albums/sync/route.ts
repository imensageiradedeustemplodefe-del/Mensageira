import { prisma } from "@/lib/prisma";
import { handler, json, requireAdmin, HttpError } from "@/lib/api";
import { sendPushToAll } from "@/lib/push";
import { fetchAppsScript } from "@/lib/apps-script";

// O Apps Script pode levar dezenas de segundos para listar pastas grandes
export const maxDuration = 60;

interface DriveAlbum {
  id: string;
  name: string;
  coverUrl?: string;
  photoCount?: number;
}

// Syncs the Google Drive albums (via the Apps Script) into gallery_albums.
// Mirrors the original `sync-drive-albums` edge function.
export const POST = handler(async () => {
  await requireAdmin();

  const setting = await prisma.siteSetting.findUnique({ where: { settingKey: "google_drive_script_url" } });
  const scriptUrl = setting?.settingValue?.trim();
  if (!scriptUrl) throw new HttpError(400, "URL do Google Drive Script não configurada");

  let res: Response;
  try {
    res = await fetchAppsScript(`${scriptUrl}?action=albums`, { signal: AbortSignal.timeout(55_000) });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    throw new HttpError(504, timeout
      ? "O Google Drive demorou mais de 55 s para responder. Tente de novo em instantes (a segunda tentativa costuma ser rápida)."
      : `Não foi possível falar com o Apps Script: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) throw new HttpError(502, `Erro ao buscar álbuns: ${res.status} ${res.statusText}`);
  const text = await res.text();
  let data: { albums?: DriveAlbum[]; error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new HttpError(502, text.includes("<html") ? "O Apps Script exigiu login do Google. Reimplante com acesso: Qualquer pessoa." : "Resposta inválida do Apps Script");
  }
  if (data.error) throw new HttpError(502, `Erro no Apps Script: ${data.error}`);
  const albums: DriveAlbum[] = data.albums || [];

  if (albums.length === 0) {
    return json({ success: true, message: "Nenhum álbum encontrado no Google Drive", total: 0, synced: 0, created: 0, updated: 0 });
  }

  let created = 0;
  let updated = 0;
  const newAlbumNames: string[] = [];

  for (const album of albums) {
    const dateMatch = album.name.match(/(\d{2})[.\-](\d{2})[.\-](\d{4})/);
    const eventDate = dateMatch ? new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T12:00:00Z`) : null;

    const albumData = {
      name: album.name,
      coverPhotoUrl: album.coverUrl || null,
      eventDate,
      isPublished: true,
      description: `Álbum sincronizado do Google Drive${dateMatch ? ` - ${dateMatch[0]}` : ""}`,
      driveFolderId: album.id,
      photoCount: typeof album.photoCount === "number" ? album.photoCount : null,
    };

    // Casa pelo id da pasta do Drive (renomear a pasta não cria álbum duplicado); nome é só o fallback
    const existing =
      (await prisma.galleryAlbum.findFirst({ where: { driveFolderId: album.id }, orderBy: { createdAt: "asc" } })) ??
      (await prisma.galleryAlbum.findFirst({ where: { name: { equals: album.name, mode: "insensitive" }, driveFolderId: null } }));

    if (existing) {
      const shouldUpdate =
        existing.name !== album.name ||
        !existing.isPublished ||
        existing.coverPhotoUrl !== (album.coverUrl || null) ||
        !existing.driveFolderId ||
        existing.driveFolderId !== album.id ||
        existing.photoCount !== (albumData.photoCount ?? null);
      if (shouldUpdate) {
        await prisma.galleryAlbum.update({ where: { id: existing.id }, data: albumData });
        updated++;
      }
    } else {
      await prisma.galleryAlbum.create({ data: albumData });
      created++;
      newAlbumNames.push(album.name);
    }
  }

  // Álbuns cuja pasta não existe mais no Drive (apagada, ou duplicata antiga): saem da galeria
  const driveIds = albums.map((a) => a.id);
  const orphans = await prisma.galleryAlbum.updateMany({
    where: { isPublished: true, OR: [{ driveFolderId: { notIn: driveIds } }, { driveFolderId: null }] },
    data: { isPublished: false },
  });

  // Duplicatas da mesma pasta (criadas quando a pasta foi renomeada): fica só o álbum mais antigo
  const published = await prisma.galleryAlbum.findMany({
    where: { isPublished: true, driveFolderId: { in: driveIds } },
    orderBy: { createdAt: "asc" },
    select: { id: true, driveFolderId: true },
  });
  const seen = new Set<string>();
  const duplicateIds = published.filter((a) => (seen.has(a.driveFolderId!) ? true : (seen.add(a.driveFolderId!), false))).map((a) => a.id);
  const duplicates = duplicateIds.length
    ? await prisma.galleryAlbum.updateMany({ where: { id: { in: duplicateIds } }, data: { isPublished: false } })
    : { count: 0 };
  const hidden = { count: orphans.count + duplicates.count };

  if (newAlbumNames.length > 0) {
    await sendPushToAll({
      title: "📸 Novas Fotos",
      body: newAlbumNames.length === 1 ? `Novo álbum: ${newAlbumNames[0]}` : `${newAlbumNames.length} novos álbuns na galeria!`,
      url: "/galeria",
    }, "galeria");
  }

  return json({
    success: true,
    message: "Sincronização concluída com sucesso",
    total: albums.length,
    synced: created + updated,
    created,
    updated,
    hidden: hidden.count,
  });
});
