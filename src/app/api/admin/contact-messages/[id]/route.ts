import { itemRoutes, contactMessages } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(contactMessages);
