import { collectionRoutes, events } from "@/lib/admin-resources";

export const { GET, POST } = collectionRoutes(events);
