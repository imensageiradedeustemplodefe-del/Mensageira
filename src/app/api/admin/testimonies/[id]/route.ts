import { itemRoutes, testimonies } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(testimonies);
