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
  fromMember?: "name" | "gender" | "birthDate" | "bairro" | "cidade" | "uf";
}

export type CertificateData = Record<string, string>;

/** Trecho do texto do certificado; `strong` = dado preenchido (destacado). */
export type CertificateRun = { text: string; strong?: boolean };

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
    { key: "nascimento", label: "Data de nascimento", type: "date", fromMember: "birthDate" },
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
    if (f(d, "nascimento")) runs.push({ text: fem ? ", nascida em " : ", nascido em " }, { text: longDate(d.nascimento), strong: true });
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

export const CERTIFICATES: CertificateTemplate[] = [ordenacaoPastoral];

export function certificateTemplate(type: string) {
  return CERTIFICATES.find((c) => c.id === type);
}

/** Valores iniciais do formulário de um modelo. */
export function initialCertificateData(t: CertificateTemplate): CertificateData {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return Object.fromEntries(t.fields.map((fl) => [fl.key, fl.initial === "today" ? today : (fl.initial ?? "")]));
}
