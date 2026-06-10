import type { Metadata } from "next";
import Link from "next/link";
import { Database, FileClock, KeyRound, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Como o Converta protege contas, arquivos e dados de conversão.",
};

const sections = [
  {
    id: "dados",
    title: "Dados que utilizamos",
    content: (
      <>
        <p>Usamos os dados básicos disponibilizados pela sua conta Google, como nome, e-mail, foto e identificador da conta, exclusivamente para autenticação e associação do seu histórico.</p>
        <p>Também armazenamos metadados operacionais das conversões, incluindo nome, formato, tamanho, status, datas e caminhos privados dos arquivos. O conteúdo dos documentos não é utilizado para publicidade ou criação de perfis.</p>
      </>
    ),
  },
  {
    id: "processamento",
    title: "Como os arquivos são processados",
    content: (
      <>
        <p>Os arquivos originais e convertidos ficam em uma área privada do Vercel Blob. Durante a conversão, o documento é enviado ao CloudConvert, que processa o conteúdo conforme seus próprios termos e política de privacidade.</p>
        <p>O Firebase é utilizado para autenticação e armazenamento dos registros do histórico. O acesso aos dados é vinculado ao identificador do usuário autenticado.</p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "Retenção e exclusão",
    content: (
      <>
        <p>Os documentos são destinados a armazenamento temporário. A exclusão automática é programada para depois de sete dias da conclusão ou falha da conversão.</p>
        <p>Você pode excluir uma conversão a qualquer momento pelo histórico. Essa ação remove os arquivos associados e o respectivo registro operacional.</p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança e acesso",
    content: (
      <>
        <p>Arquivos são armazenados com acesso privado. Uploads, downloads, exclusões e processamento exigem uma sessão autenticada e validação de propriedade no servidor.</p>
        <p>Nenhuma transmissão pela internet é totalmente isenta de risco. Mantemos controles compatíveis com a finalidade do serviço e recomendamos não enviar documentos desnecessariamente sensíveis.</p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Suas escolhas",
    content: (
      <>
        <p>Você pode excluir conversões individualmente, encerrar sua sessão e deixar de utilizar o serviço a qualquer momento. Para solicitar esclarecimentos ou remoção de dados que não estejam disponíveis no painel, utilize o canal de contato indicado pelo responsável pelo projeto.</p>
        <p>Esta política poderá ser atualizada quando houver mudanças relevantes nos serviços utilizados ou no funcionamento do Converta. A data da versão vigente será sempre exibida nesta página.</p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <header className="legal-hero">
          <div className="shell legal-hero-grid">
            <div>
              <span className="eyebrow">Privacidade por princípio</span>
              <h1>Seus documentos continuam sendo seus.</h1>
              <p>Esta política explica, em linguagem direta, quais dados o Converta utiliza, onde os arquivos passam e quais controles estão disponíveis para você.</p>
              <span className="legal-updated">Última atualização: 10 de junho de 2026</span>
            </div>
            <div className="privacy-summary" aria-label="Resumo de privacidade">
              <div><LockKeyhole size={20} /><span><strong>Arquivos privados</strong> sem acesso público por URL.</span></div>
              <div><FileClock size={20} /><span><strong>Uso temporário</strong> com exclusão disponível no histórico.</span></div>
              <div><KeyRound size={20} /><span><strong>Login Google</strong> usado somente para autenticação.</span></div>
            </div>
          </div>
        </header>

        <div className="shell legal-layout">
          <aside className="legal-index">
            <span>Nesta política</span>
            {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
          </aside>
          <article className="legal-content">
            {sections.map((section, index) => (
              <section id={section.id} className="legal-section" key={section.id}>
                <span className="legal-number">{String(index + 1).padStart(2, "0")}</span>
                <div><h2>{section.title}</h2>{section.content}</div>
              </section>
            ))}
            <div className="provider-note">
              <Database size={22} />
              <div>
                <strong>Serviços essenciais</strong>
                <p>O funcionamento depende de Google Firebase, Vercel e CloudConvert. Consulte também as políticas desses fornecedores para entender seus respectivos tratamentos de dados.</p>
              </div>
            </div>
          </article>
        </div>
      </main>
      <footer className="footer"><div className="shell footer-row"><Brand /><span>© 2026 Converta</span><div className="footer-links"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></div></div></footer>
    </>
  );
}
