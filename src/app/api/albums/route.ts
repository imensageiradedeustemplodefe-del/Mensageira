import { handler, json } from "@/lib/api";
import { getPublishedAlbums } from "@/lib/gallery";

export const GET = handler(async () => json(await getPublishedAlbums()));
