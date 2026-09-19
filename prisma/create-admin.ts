import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cria ou atualiza um administrador.
// Uso: npm run admin:create -- <email> <senha> [nome]

const [email, password, name] = process.argv.slice(2);
if (!email || !password) {
  console.error("Uso: npm run admin:create -- <email> <senha> [nome]");
  process.exit(1);
}
if (password.length < 6) {
  console.error("A senha deve ter pelo menos 6 caracteres.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash, role: "admin", ...(name ? { name } : {}) },
    create: { email: email.toLowerCase().trim(), passwordHash, role: "admin", name: name ?? "Administrador" },
  });
  console.log(`✔ admin pronto: ${user.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
