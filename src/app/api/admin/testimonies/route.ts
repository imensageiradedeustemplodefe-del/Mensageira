import { collectionRoutes, testimonies } from "@/lib/admin-resources";

export const { GET, POST } = collectionRoutes(testimonies);
