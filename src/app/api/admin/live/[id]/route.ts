import { itemRoutes, live } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(live);
