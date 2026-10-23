import { z } from "zod";
import { STAFF_ROLES } from "@/lib/roles";

// Campos de usuário do painel aceitos pela API (criar e editar)
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,32}$/, "usuário: 3 a 32 letras minúsculas, números, ponto, hífen ou sublinhado, sem espaços");
export const passwordSchema = z.string().min(8, "a senha precisa de pelo menos 8 caracteres").max(200);

export const userCreateSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(2).max(100),
  role: z.enum(STAFF_ROLES),
  password: passwordSchema,
});

export const userUpdateSchema = z.object({
  username: usernameSchema.optional(),
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  password: passwordSchema.optional(),
});

/** Dados do usuário que podem ir para a tela (nunca o hash da senha). */
export const userSelect = { id: true, username: true, name: true, role: true, createdAt: true } as const;
