import { collectionRoutes, members } from "@/lib/admin-resources";

export const { GET, POST } = collectionRoutes(members);
