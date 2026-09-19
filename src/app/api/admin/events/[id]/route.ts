import { itemRoutes, events } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(events);
