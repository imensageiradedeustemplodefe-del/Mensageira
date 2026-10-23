import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cria ou atualiza um administrador do painel (também serve para recuperar a senha).
// Uso: npm run admin:create -- <usuario> <senha> [nome]

const [rawUsername, password, name] = process.argv.slice(2);
const username = rawUsername?.toLowerCase().trim();
if (!username || !password) {
  console.error("Uso: npm run admin:create -- <usuario> <senha> [nome]");
  process.exit(1);
}
if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
  console.error("Usuário: 3 a 32 letras minúsculas, números, ponto, hífen ou sublinhado.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("A senha deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: "admin", ...(name ? { name } : {}) },
    create: { username, passwordHash, role: "admin", name: name ?? "Administrador" },
  });
  console.log(`✔ admin pronto: ${user.username}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
