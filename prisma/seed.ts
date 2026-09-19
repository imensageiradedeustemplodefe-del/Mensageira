import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import verses from "./data/daily-verses.json";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Setting = [key: string, value: string, type: string, category: string, displayName: string, description: string];

const siteSettings: Setting[] = [
  // Informações Gerais
  ["church_name", "Igreja Mensageira de Deus - Templo de Fé", "text", "general", "Nome da Igreja", "Nome completo da igreja"],
  ["church_slogan", "Proclamando a Palavra de Deus com Fé e Amor", "text", "general", "Slogan/Lema", "Frase que representa a igreja"],
  ["hero_title", "Bem-vindos à Mensageira de Deus", "text", "general", "Título Principal", "Título da página inicial"],
  ["hero_subtitle", "Templo de Fé", "text", "general", "Subtítulo", "Subtítulo da página inicial"],
  ["hero_description", "Uma igreja comprometida com a Palavra de Deus, onde vidas são transformadas e famílias são edificadas no amor de Cristo.", "textarea", "general", "Descrição Principal", "Descrição da página inicial"],

  // Contato
  ["church_address", "R. Elias Biasi, 49 - Berger, Caçador - SC, 89500-000", "textarea", "contact", "Endereço", "Endereço completo da igreja"],
  ["church_phone", "", "text", "contact", "Telefone", "Telefone principal da igreja"],
  ["church_email", "imensageiradedeustemplodefe@gmail.com", "email", "contact", "E-mail", "E-mail para contato"],
  ["contact_email_secretary", "imensageiradedeustemplodefe@gmail.com", "email", "contact", "E-mail da Secretaria", "E-mail principal da secretaria"],
  ["contact_address_full", "R. Elias Biasi, 49 - Berger, Caçador - SC, 89500-000", "textarea", "contact", "Endereço Completo", "Endereço completo com CEP"],

  // Redes Sociais
  ["facebook_url", "https://www.facebook.com/igrejamensageira", "url", "social", "Facebook", "Link do Facebook da igreja"],
  ["instagram_url", "https://www.instagram.com/igrejamensageira", "url", "social", "Instagram", "Link do Instagram da igreja"],
  ["youtube_url", "https://www.youtube.com/@imensageiradedeustemlodefe", "url", "social", "YouTube", "Link do canal do YouTube"],
  ["whatsapp_number", "", "text", "social", "WhatsApp", "Número do WhatsApp para contato"],

  // Horários
  ["sunday_service_time", "19:30", "time", "schedule", "Culto Dominical", "Horário do culto de domingo"],
  ["wednesday_service_time", "19:30", "time", "schedule", "Culto de Quarta", "Horário do culto de quarta-feira"],
  ["friday_service_time", "20:00", "time", "schedule", "Culto de Sexta", "Horário do culto de sexta-feira"],

  // Live
  ["live_youtube_id", "", "text", "live", "ID do YouTube Live", "ID do vídeo/canal para transmissão ao vivo"],
  ["live_facebook_url", "", "url", "live", "Link Facebook Live", "Link para transmissão no Facebook"],

  // Sobre
  ["church_description", "A Mensageira de Deus Templo de Fé é uma comunidade de fé comprometida com a pregação da Palavra de Deus e o cuidado pastoral das famílias.", "textarea", "about", "Descrição da Igreja", "Texto sobre a igreja para a página Sobre"],
  ["pastor_name", "Pr. Gilmar Radaelli", "text", "about", "Nome do Pastor", "Nome do pastor principal"],
  ["church_founded_year", "", "number", "about", "Ano de Fundação", "Ano em que a igreja foi fundada"],
  ["pastor_principal_name", "Pr. Gilmar Radaelli", "text", "about", "Pastor Principal", "Nome do pastor responsável principal"],
  ["pastor_principal_description", "Líder espiritual dedicado ao crescimento da igreja e ao cuidado pastoral das famílias.", "textarea", "about", "Descrição Pastor Principal", "Descrição do pastor principal"],
  ["pastora_name", "Pra. Vera Lucia Radaelli", "text", "about", "Nome da Pastora", "Nome da pastora responsável"],
  ["pastora_description", "Comprometida com o ministério de mulheres e o ensino da Palavra de Deus.", "textarea", "about", "Descrição da Pastora", "Descrição da pastora"],
  ["pastor_auxiliar_name", "Pr. João Batista", "text", "about", "Pastor Auxiliar", "Nome do pastor auxiliar"],
  ["pastor_auxiliar_description", "Apoio pastoral e liderança em diversas atividades da congregação.", "textarea", "about", "Descrição Pastor Auxiliar", "Descrição do pastor auxiliar"],

  // Integrações Google (privadas — nunca expostas publicamente)
  ["google_drive_script_url", "", "text", "integrations", "URL do Google Apps Script (Galeria)", "URL do Apps Script que lista os álbuns/fotos do Google Drive"],
  ["event_registration_script_url", "", "text", "integrations", "URL do Google Apps Script (Inscrições)", "URL do Google Apps Script que gerencia as planilhas de inscrições na pasta Inscrições_Eventos"],
];

const eventTemplates = [
  ["Culto de Adoração", "Culto de Adoração", "culto", "Junte-se a nós para um momento especial de adoração, louvor e palavra de Deus. Venha experimentar a presença do Senhor em nossa comunidade.", "Templo Principal", true],
  ["Cerimônia de Batismo", "Cerimônia de Batismo", "batismo", "Celebrando o novo nascimento em Cristo através do batismo nas águas. Uma cerimônia especial de compromisso com Jesus.", "Batistério do Templo", true],
  ["Encontro de Jovens", "Encontro de Jovens", "jovens", "Um momento especial para os jovens se conectarem com Deus através de louvor, palavra e comunhão. Venha fazer parte desta família!", "Salão dos Jovens", true],
  ["Santa Ceia", "Santa Ceia", "ceia", "Participem conosco da Santa Ceia, recordando o sacrifício de Jesus Cristo por nós. Um momento de reflexão e comunhão.", "Templo Principal", true],
  ["Campanha de Oração", "Campanha de Oração", "campanha", "Dias especiais de oração e busca pela presença de Deus. Venha participar desta campanha de avivamento espiritual.", "Templo Principal", true],
  ["Retiro Espiritual", "Retiro Espiritual", "retiro", "Um tempo especial de comunhão, oração e palavra de Deus. Momentos únicos de crescimento espiritual e renovação.", "Centro de Retiros", true],
  ["Conferência Ministerial", "Conferência Ministerial", "conferencia", "Dias especiais de ensino, workshops e ministração. Uma oportunidade de crescimento e capacitação ministerial.", "Auditório Principal", true],
  ["Ação Evangelística", "Ação Evangelística", "evangelismo", "Saída missionária para compartilhar o amor de Cristo. Juntos levando a palavra de Deus àqueles que precisam.", "Praça Central", true],
  ["Lava Car Beneficente", "Lava Car Beneficente", "lavacar", "Ação social da igreja para arrecadar recursos para obras missionárias. Venha lavar seu carro e contribuir com a obra.", "Estacionamento da Igreja", true],
  ["Culto da Família", "Culto da Família", "culto", "Momento especial de adoração e ministração voltado para toda a família, com atividades e palavra direcionada para edificação do lar.", "Templo Principal", false],
  ["Culto Cura e Libertação", "Culto de Cura e Libertação", "culto", "Culto de poder com ministração de cura e libertação, momento de quebra de cadeias e renovação espiritual.", "Templo Principal", false],
  ["Homens de Propósito", "Culto Homens de Propósito", "culto", "Encontro especial para os homens da igreja. Um momento de comunhão, ensinamento e fortalecimento espiritual.", null, false],
] as const;

const mediaCategories = [
  ["Louvor e Adoração", "louvor-adoracao", "music"],
  ["Pregações", "pregacoes", "mic"],
  ["Rádio Gospel", "radio-gospel", "radio"],
  ["Música Instrumental", "instrumental", "piano"],
];

const galleryCategories = [
  ["Cultos", "cultos", "Heart"],
  ["Batismos", "batismos", "Users"],
  ["Música", "musica", "Camera"],
  ["Grupos", "grupos", "Users"],
  ["Crianças", "criancas", "Heart"],
  ["Jovens", "jovens", "Users"],
  ["Oração", "oracao", "Heart"],
];

async function main() {
  // Admin inicial
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@mensageiradedeus.com.br").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "troque-esta-senha";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Administrador", passwordHash, role: "admin" },
  });
  console.log(`✔ admin: ${email}`);

  // Configurações do site (não sobrescreve valores já editados)
  for (const [settingKey, settingValue, settingType, category, displayName, description] of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { settingKey },
      update: {},
      create: { settingKey, settingValue, settingType, category, displayName, description },
    });
  }
  console.log(`✔ site_settings: ${siteSettings.length}`);

  // Versículos
  if ((await prisma.dailyVerse.count()) === 0) {
    await prisma.dailyVerse.createMany({ data: verses });
    console.log(`✔ daily_verses: ${verses.length}`);
  }

  // Templates de evento
  if ((await prisma.eventTemplate.count()) === 0) {
    await prisma.eventTemplate.createMany({
      data: eventTemplates.map(([name, title, category, description, location, isDefault]) => ({
        name, title, category, description, location, isDefault,
      })),
    });
    console.log(`✔ event_templates: ${eventTemplates.length}`);
  }

  // Categorias
  for (const [name, slug, icon] of mediaCategories) {
    await prisma.mediaCategory.upsert({ where: { slug }, update: {}, create: { name, slug, icon } });
  }
  for (const [name, slug, icon] of galleryCategories) {
    await prisma.galleryCategory.upsert({ where: { slug }, update: {}, create: { name, slug, icon } });
  }
  console.log("✔ categorias");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
