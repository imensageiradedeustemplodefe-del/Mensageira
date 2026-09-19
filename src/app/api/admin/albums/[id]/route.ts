import { itemRoutes, albums } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(albums);
