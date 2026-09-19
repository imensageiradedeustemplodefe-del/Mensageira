import { itemRoutes, customNotifications } from "@/lib/admin-resources";

export const { GET, PATCH, DELETE } = itemRoutes(customNotifications);
