// Modelos de certificado da Secretaria. Cada modelo tem uma arte de fundo (A4 deitado, só com título e
// enfeites) e o texto é escrito por cima, corrido, ajustando-se ao tamanho dos nomes.
// Para um modelo novo: coloque a arte em public/certificados/ e acrescente um item em CERTIFICATES.

export type CertificateFieldType = "text" | "date" | "uf" | "gender";

export interface CertificateField {
  /** Chave em `data` (uma palavra minúscula: a API converte snake/camelCase). */
  key: string;
  label: string;
  type: CertificateFieldType;
  required?: boolean;
  placeholder?: string;
  /** Valor inicial do formulário ("today" = data de hoje). */
  initial?: string;
  /** Campo puxado do cadastro do membro, quando um membro é escolhido. */
  fromMember?: "name" | "gender" | "birthDate" | "baptismDate" | "bairro" | "cidade" | "uf";
}

export type CertificateData = Record<string, string>;

/** Trecho do texto do certificado; `strong` = dado preenchido (destacado); `big` = linha própria, em letra maior (nome). */
export type CertificateRun = { text: string; strong?: boolean; big?: boolean };

export interface CertificateSignature {
  /** Posição da linha de assinatura na arte (% da página). */
  left: number;
  top: number;
  width: number;
  name: string;
  role: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  background: string;
  fields: CertificateField[];
  /** Área do texto corrido (% da página). */
  body: { left: number; top: number; width: number; height: number };
  text: (d: CertificateData) => CertificateRun[];
  signatures: (d: CertificateData) => CertificateSignature[];
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-23" → "23 de outubro de 2026" */
export function longDate(iso?: string) {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${Number(m[3])} de ${MONTHS[Number(m[2]) - 1]} de ${m[1]}`;
}

/** "2026-10-23" → "23/10/2026" */
export function shortDate(iso?: string | null) {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

export const CHURCH_NAME = "Igreja Mensageira de Deus Templo de Fé";

const f = (d: CertificateData, k: string) => (d[k] ?? "").trim();

const ordenacaoPastoral: CertificateTemplate = {
  id: "ordenacao-pastoral",
  name: "Ordenação ao Ministério Pastoral",
  background: "/certificados/ordenacao-pastoral.jpg",
  fields: [
    { key: "nome", label: "Nome completo", type: "text", required: true, fromMember: "name" },
    { key: "genero", label: "Tratamento", type: "gender", initial: "M", fromMember: "gender" },
    { key: "naturalidade", label: "Nascido(a) em (cidade)", type: "text", placeholder: "Ex.: Caçador" },
    { key: "igreja", label: "Ordenado(a) pela igreja", type: "text", required: true, initial: CHURCH_NAME },
    { key: "bairro", label: "Bairro", type: "text", fromMember: "bairro" },
    { key: "cidade", label: "Cidade", type: "text", required: true, fromMember: "cidade" },
    { key: "uf", label: "UF", type: "uf", required: true, fromMember: "uf" },
    { key: "data", label: "Data da ordenação", type: "date", required: true, initial: "today" },
    { key: "assinante", label: "Quem assina (pastor)", type: "text", required: true, initial: "Gilmar José Radaelli" },
    { key: "funcao", label: "Cargo de quem assina", type: "text", initial: "Pastor" },
  ],
  body: { left: 7, top: 47, width: 86, height: 31 },
  text: (d) => {
    const fem = d.genero === "F";
    const runs: CertificateRun[] = [
      { text: fem ? "Certificamos que a Sra. " : "Certificamos que o Sr. " },
      { text: f(d, "nome") || "—", strong: true },
    ];
    if (f(d, "naturalidade")) runs.push({ text: fem ? ", nascida em " : ", nascido em " }, { text: f(d, "naturalidade"), strong: true });
    runs.push({ text: fem ? ", foi ordenada Pastora pela " : ", foi ordenado Pastor pela " }, { text: f(d, "igreja"), strong: true });
    const place = [f(d, "bairro") && `bairro ${f(d, "bairro")}`, [f(d, "cidade"), f(d, "uf").toUpperCase()].filter(Boolean).join("/")]
      .filter(Boolean)
      .join(", ");
    if (place) runs.push({ text: ", " }, { text: place, strong: true });
    runs.push({ text: ", no dia " }, { text: longDate(d.data), strong: true }, { text: "." });
    return runs;
  },
  signatures: (d) => [
    { left: 39.57, top: 82.27, width: 20.75, name: f(d, "assinante"), role: f(d, "funcao") },
    { left: 71.61, top: 82.27, width: 20.75, name: f(d, "nome"), role: d.genero === "F" ? "Pastora ordenada" : "Pastor ordenado" },
  ],
};

const batismo: CertificateTemplate = {
  id: "batismo",
  name: "Batismo",
  background: "/certificados/batismo.jpg",
  fields: [
    { key: "nome", label: "Nome completo", type: "text", required: true, fromMember: "name" },
    { key: "genero", label: "Tratamento", type: "gender", initial: "M", fromMember: "gender" },
    { key: "data", label: "Data do batismo", type: "date", required: true, initial: "today", fromMember: "baptismDate" },
    { key: "assinante", label: "Quem assina (pastor)", type: "text", required: true, initial: "Gilmar José Radaelli" },
    { key: "funcao", label: "Cargo de quem assina", type: "text", initial: "Pastor" },
  ],
  body: { left: 15, top: 56, width: 70, height: 26 },
  text: (d) => [
    { text: "Certificamos que" },
    { text: f(d, "nome") || "—", strong: true, big: true },
    { text: "crendo e obedecendo às Sagradas Escrituras e às doutrinas ensinadas por Jesus Cristo, " },
    { text: d.genero === "F" ? "foi batizada" : "foi batizado" },
    { text: " sob profissão de fé, em nome do " },
    { text: "Pai, do Filho e do Espírito Santo", strong: true },
    { text: ", no dia " },
    { text: longDate(d.data), strong: true },
    { text: "." },
  ],
  signatures: (d) => [
    { left: 22.2, top: 87.3, width: 20.8, name: f(d, "assinante"), role: f(d, "funcao") },
    { left: 57.2, top: 87.3, width: 20.6, name: f(d, "nome"), role: d.genero === "F" ? "Batizada" : "Batizado" },
  ],
};

const PASTOR_FIELDS: CertificateField[] = [
  { key: "assinante", label: "Quem assina (pastor)", type: "text", required: true, initial: "Gilmar José Radaelli" },
  { key: "funcao", label: "Cargo de quem assina", type: "text", initial: "Pastor" },
];

const casamento: CertificateTemplate = {
  id: "casamento",
  name: "Casamento",
  background: "/certificados/casamento.jpg",
  fields: [
    { key: "noivo", label: "Nome do noivo", type: "text", required: true },
    { key: "noiva", label: "Nome da noiva", type: "text", required: true },
    { key: "data", label: "Data do casamento", type: "date", required: true, initial: "today" },
    { key: "testemunha1", label: "Testemunha 1 (opcional)", type: "text" },
    { key: "testemunha2", label: "Testemunha 2 (opcional)", type: "text" },
    ...PASTOR_FIELDS,
  ],
  body: { left: 24, top: 39.5, width: 54, height: 19 },
  text: (d) => [
    { text: `${f(d, "noivo") || "—"} e ${f(d, "noiva") || "—"}`, strong: true, big: true },
    { text: "pela realização do seu matrimônio no dia " },
    { text: longDate(d.data), strong: true },
    { text: "." },
  ],
  signatures: (d) => [
    { left: 39, top: 68, width: 17.6, name: f(d, "assinante"), role: f(d, "funcao") },
    { left: 19.5, top: 76.3, width: 18.7, name: f(d, "testemunha1"), role: "Testemunha" },
    { left: 57.1, top: 76.3, width: 16.5, name: f(d, "testemunha2"), role: "Testemunha" },
  ],
};

const obreiro: CertificateTemplate = {
  id: "obreiro",
  name: "Obreiro(a)",
  background: "/certificados/obreiro.jpg",
  fields: [
    { key: "nome", label: "Nome completo", type: "text", required: true, fromMember: "name" },
    { key: "genero", label: "Tratamento", type: "gender", initial: "M", fromMember: "gender" },
    { key: "pai", label: "Nome do pai", type: "text" },
    { key: "mae", label: "Nome da mãe", type: "text" },
    { key: "data", label: "Data da separação", type: "date", required: true, initial: "today" },
    { key: "igreja", label: "Igreja", type: "text", required: true, initial: CHURCH_NAME },
    ...PASTOR_FIELDS,
  ],
  body: { left: 9, top: 30, width: 82, height: 34 },
  text: (d) => {
    const fem = d.genero === "F";
    const parents = [f(d, "pai"), f(d, "mae")].filter(Boolean);
    const runs: CertificateRun[] = [{ text: "Certifico que " }, { text: f(d, "nome") || "—", strong: true }];
    if (parents.length) {
      runs.push({ text: fem ? ", filha de " : ", filho de " }, { text: parents[0], strong: true });
      if (parents[1]) runs.push({ text: " e " }, { text: parents[1], strong: true });
    }
    runs.push(
      { text: fem ? ", foi separada para o trabalho na Casa do Senhor, como " : ", foi separado para o trabalho na Casa do Senhor, como " },
      { text: fem ? "Obreira" : "Obreiro", strong: true },
      { text: ", no dia " },
      { text: longDate(d.data), strong: true },
      { text: ", na " },
      { text: f(d, "igreja"), strong: true },
      { text: "." },
    );
    return runs;
  },
  signatures: (d) => [{ left: 64.3, top: 73.8, width: 21, name: f(d, "assinante"), role: f(d, "funcao") }],
};

const apresentacao: CertificateTemplate = {
  id: "apresentacao",
  name: "Apresentação de criança",
  background: "/certificados/apresentacao.jpg",
  fields: [
    { key: "nome", label: "Nome da criança", type: "text", required: true },
    { key: "genero", label: "Menino ou menina", type: "gender", initial: "M" },
    { key: "nascimento", label: "Data de nascimento", type: "date" },
    { key: "pai", label: "Nome do pai", type: "text" },
    { key: "mae", label: "Nome da mãe", type: "text" },
    { key: "cidade", label: "Cidade", type: "text", placeholder: "Ex.: Caçador" },
    { key: "data", label: "Data da apresentação", type: "date", required: true, initial: "today" },
    ...PASTOR_FIELDS,
  ],
  body: { left: 9, top: 37.5, width: 82, height: 16.5 },
  text: (d) => {
    const fem = d.genero === "F";
    const parents = [f(d, "pai"), f(d, "mae")].filter(Boolean);
    const runs: CertificateRun[] = [{ text: "Certificamos que " }, { text: f(d, "nome") || "—", strong: true }];
    if (f(d, "nascimento")) runs.push({ text: fem ? ", nascida em " : ", nascido em " }, { text: longDate(d.nascimento), strong: true });
    if (parents.length) {
      runs.push({ text: fem ? ", filha de " : ", filho de " }, { text: parents[0], strong: true });
      if (parents[1]) runs.push({ text: " e " }, { text: parents[1], strong: true });
    }
    runs.push({ text: fem ? ", foi apresentada" : ", foi apresentado" }, { text: " ao Senhor Jesus Cristo conforme a palavra de Deus em Lucas 2:22" });
    if (f(d, "cidade")) runs.push({ text: ", em " }, { text: f(d, "cidade"), strong: true });
    runs.push({ text: ", no dia " }, { text: longDate(d.data), strong: true }, { text: "." });
    return runs;
  },
  signatures: (d) => [{ left: 47.3, top: 72.9, width: 23.9, name: f(d, "assinante"), role: f(d, "funcao") }],
};

export const CERTIFICATES: CertificateTemplate[] = [batismo, apresentacao, casamento, obreiro, ordenacaoPastoral];

export function certificateTemplate(type: string) {
  return CERTIFICATES.find((c) => c.id === type);
}

/** Valores iniciais do formulário de um modelo. */
export function initialCertificateData(t: CertificateTemplate): CertificateData {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return Object.fromEntries(t.fields.map((fl) => [fl.key, fl.initial === "today" ? today : (fl.initial ?? "")]));
}
