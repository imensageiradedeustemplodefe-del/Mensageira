import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Igreja Mensageira de Deus Templo de Fé trata os dados pessoais enviados pelo site e pelo aplicativo.",
};

const EMAIL = "imensageiradedeustemplodefe@gmail.com";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Política de Privacidade</h1>
          <p className="text-lg text-muted-foreground">Última atualização: 21 de setembro de 2026</p>
        </div>
      </section>

      <section className="py-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-foreground leading-relaxed">
          <p>
            A <strong>Igreja Mensageira de Deus Templo de Fé</strong> (&quot;Igreja&quot;, &quot;nós&quot;) respeita a sua
            privacidade. Esta política explica, de forma simples, quais dados coletamos no site{" "}
            <strong>imensageiradedeus.com.br</strong> e no aplicativo (PWA), por que coletamos e como você pode exercer seus
            direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
          </p>

          <div>
            <h2 className="text-2xl font-bold mb-3">1. Quais dados coletamos</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Pedidos de oração:</strong> nome, texto do pedido e, se você quiser, e-mail
                e telefone. Os contatos são guardados criptografados e só a equipe pastoral tem acesso.
              </li>
              <li>
                <strong className="text-foreground">Testemunhos:</strong> nome e o testemunho enviado. Só são publicados após
                aprovação da igreja.
              </li>
              <li>
                <strong className="text-foreground">Formulário de contato:</strong> nome, e-mail, telefone (opcional), assunto e
                mensagem.
              </li>
              <li>
                <strong className="text-foreground">Inscrições em eventos:</strong> os dados pedidos no formulário de cada
                evento (por exemplo nome, telefone, idade), usados apenas para organizar o evento.
              </li>
              <li>
                <strong className="text-foreground">Notificações:</strong> se você ativar as notificações, o navegador gera um
                endereço técnico de envio (sem nome ou e-mail) que guardamos para poder enviar os avisos.
              </li>
              <li>
                <strong className="text-foreground">Reações nas fotos:</strong> um identificador anônimo gerado no seu aparelho,
                sem dados pessoais.
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Não usamos cookies de rastreamento nem vendemos ou compartilhamos dados com anunciantes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">2. Para que usamos</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Orar pelos pedidos e, quando você deixar contato, entrar em contato para acompanhamento.</li>
              <li>Responder mensagens enviadas pelo formulário de contato.</li>
              <li>Organizar eventos e confirmar inscrições.</li>
              <li>Enviar avisos de cultos, eventos, transmissões ao vivo e o versículo do dia (só para quem ativou).</li>
              <li>Publicar testemunhos aprovados, com o nome informado por você.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">3. Com quem compartilhamos</h2>
            <p className="text-muted-foreground">
              Os dados ficam armazenados em serviços de nuvem contratados pela igreja (hospedagem e banco de dados na Vercel;
              planilhas e fotos no Google Drive/Google Sheets da igreja). Esses provedores tratam os dados apenas para prestar
              o serviço. As notificações são entregues pelos serviços de push do seu navegador (Google, Apple ou Mozilla).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">4. Por quanto tempo guardamos</h2>
            <p className="text-muted-foreground">
              Pedidos de oração, mensagens e inscrições ficam guardados enquanto forem úteis para a finalidade acima e são
              excluídos a pedido. Notificações podem ser desativadas a qualquer momento pelo sino no topo do site ou nas
              configurações do navegador — o endereço de envio é então descartado.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">5. Seus direitos</h2>
            <p className="text-muted-foreground">
              Você pode pedir a qualquer momento para saber quais dados temos sobre você, corrigi-los, excluí-los ou revogar
              um consentimento. Basta escrever para{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a> ou usar a página de{" "}
              <Link href="/contato" className="text-primary underline">Contato</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">6. Crianças e adolescentes</h2>
            <p className="text-muted-foreground">
              Inscrições de menores de idade devem ser feitas pelos responsáveis. Não coletamos intencionalmente dados de
              crianças sem essa autorização.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">7. Alterações</h2>
            <p className="text-muted-foreground">Esta política pode ser atualizada. A data no topo indica a versão vigente.</p>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <p className="font-medium">Controlador dos dados</p>
            <p className="text-muted-foreground text-sm mt-1">
              Igreja Mensageira de Deus Templo de Fé — R. Elias Biasi, 49 - Berger, Caçador - SC, 89500-000 —{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a>
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
