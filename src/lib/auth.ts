import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, hit, overLimit } from "@/lib/rate-limit";
import { isStaffRole, type StaffRole } from "@/lib/roles";

type AnyRole = StaffRole | "moderator" | "user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AnyRole;
      username: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: AnyRole;
    username?: string;
  }
}

// "login" = nome de usuário (ou o e-mail antigo, para quem ainda digita o e-mail)
const credentialsSchema = z.object({
  login: z.string().trim().min(2).max(255),
  password: z.string().min(6).max(200),
});

/** Login bloqueado por excesso de tentativas erradas (a tela mostra uma mensagem própria). */
class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

/** De quanto em quanto tempo a sessão confere no banco se o usuário ainda existe e qual é o papel. */
const RECHECK_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // sessão do painel vale 7 dias
  session: { strategy: "jwt", maxAge: 7 * 24 * 3600 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        login: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Contra tentativa de adivinhar senha: no máximo 10 tentativas ERRADAS a cada 15 min por IP
        // e 30 por hora para o mesmo usuário (vindas de qualquer lugar). Login certo não conta,
        // senão a equipe entrando com vários usuários do mesmo lugar ficava bloqueada.
        const login = parsed.data.login.toLowerCase();
        const ipKey = `login-ip:${clientIp(request)}`;
        const userKey = `login-user:${login}`;
        if ((await overLimit(ipKey, 10)) || (await overLimit(userKey, 30))) throw new TooManyAttempts();
        const failed = async () => {
          await hit(ipKey, 10, 900);
          await hit(userKey, 30, 3600);
          return null;
        };

        const user = await prisma.user.findUnique({
          where: login.includes("@") ? { email: login } : { username: login },
        });
        if (!user || !isStaffRole(user.role)) {
          // mesmo tempo de resposta com ou sem usuário (não revela quais usuários existem)
          await bcrypt.compare(parsed.data.password, "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.UpN0Zl6WuJ3mJhDmlCuLwMz2VK8a");
          return failed();
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return failed();

        return { id: user.id, email: user.email, name: user.name, role: user.role, username: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.checkedAt = Date.now();
        return token;
      }
      // usuário excluído ou com papel trocado: vale em poucos minutos, sem esperar a sessão vencer
      if (token.id && Date.now() - Number(token.checkedAt ?? 0) > RECHECK_MS) {
        const current = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, username: true, name: true },
        });
        if (!current || !isStaffRole(current.role)) return null;
        token.role = current.role;
        token.username = current.username;
        token.name = current.name;
        token.checkedAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = (token.role as AnyRole) ?? "user";
      session.user.username = (token.username as string) ?? "";
      return session;
    },
  },
});

/** Sessão de alguém da equipe (admin, mídia ou secretaria), ou null. Com `roles`, só se o papel estiver na lista. */
export async function getStaffSession(roles?: StaffRole[]) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !isStaffRole(role)) return null;
  if (roles && role !== "admin" && !roles.includes(role)) return null;
  return session as typeof session & { user: { role: StaffRole } };
}

/** Sessão de administrador, ou null. */
export async function getAdminSession() {
  const session = await getStaffSession();
  return session?.user.role === "admin" ? session : null;
}
