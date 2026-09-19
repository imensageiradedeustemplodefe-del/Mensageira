import { collectionRoutes, albums } from "@/lib/admin-resources";

export const { GET, POST } = collectionRoutes(albums);
