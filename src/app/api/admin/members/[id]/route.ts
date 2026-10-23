import { itemRoutes, members } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(members);
