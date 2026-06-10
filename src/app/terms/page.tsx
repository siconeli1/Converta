import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, FileCheck2, Scale, ServerCog } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Condições para utilização responsável do Converta.",
};

const sections = [
  {
    id: "aceite",
    title: "Aceitação dos termos",
    content: (
      <p>Ao utilizar o Converta, você declara ter lido e aceitado estes termos e a Política de Privacidade. Caso não concorde, não envie arquivos nem utilize as funcionalidades de conversão.</p>
    ),
  },
  {
    id: "uso",
    title: "Uso permitido",
    content: (
      <>
        <p>Envie apenas documentos que você criou, possui ou tem autorização para processar. É proibido utilizar o serviço com conteúdo ilegal, malicioso, fraudulento ou que viole direitos de terceiros.</p>
        <p>Você é responsável pelo conteúdo enviado e pelas consequências decorrentes do seu uso após a conversão.</p>
      </>
    ),
  },
  {
    id: "conversoes",
    title: "Resultados das conversões",
    content: (
      <>
        <p>Conversões entre PDF e DOCX podem modificar fontes, imagens, tabelas, paginação e outros elementos de formatação, especialmente em documentos digitalizados ou estruturalmente complexos.</p>
        <p>Revise o arquivo convertido antes de utilizá-lo em atividades acadêmicas, profissionais, jurídicas ou administrativas.</p>
      </>
    ),
  },
  {
    id: "disponibilidade",
    title: "Disponibilidade do serviço",
    content: (
      <>
        <p>O Converta depende de serviços fornecidos por Google Firebase, Vercel e CloudConvert. Manutenções, limites de uso ou indisponibilidades desses fornecedores podem interromper temporariamente alguma funcionalidade.</p>
        <p>O serviço pode ser alterado, suspenso ou atualizado para manutenção, segurança ou melhoria da experiência.</p>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Armazenamento e responsabilidade",
    content: (
      <>
        <p>O Converta não deve ser utilizado como armazenamento permanente. Mantenha cópias dos arquivos originais e baixe os resultados que desejar preservar.</p>
        <p>Na extensão permitida pela legislação aplicável, o serviço é oferecido sem garantia de preservação integral de layout, disponibilidade contínua ou adequação a uma finalidade específica.</p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações destes termos",
    content: (
      <p>Estes termos poderão ser atualizados para acompanhar mudanças técnicas, legais ou operacionais. A versão vigente e sua data de atualização serão mantidas nesta página.</p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <header className="legal-hero terms-hero">
          <div className="shell legal-hero-grid">
            <div>
              <span className="eyebrow">Uso responsável</span>
              <h1>Termos claros para uma ferramenta direta.</h1>
              <p>Estas condições definem o uso adequado do Converta, as limitações naturais das conversões e as responsabilidades de quem utiliza o serviço.</p>
              <span className="legal-updated">Última atualização: 10 de junho de 2026</span>
            </div>
            <div className="privacy-summary" aria-label="Resumo dos termos">
              <div><FileCheck2 size={20} /><span><strong>Arquivos autorizados</strong> devem ser enviados pelo titular ou com permissão.</span></div>
              <div><AlertCircle size={20} /><span><strong>Revise o resultado</strong> antes de usar o documento convertido.</span></div>
              <div><ServerCog size={20} /><span><strong>Serviço temporário</strong> sujeito à disponibilidade dos fornecedores.</span></div>
            </div>
          </div>
        </header>

        <div className="shell legal-layout">
          <aside className="legal-index">
            <span>Nestes termos</span>
            {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
          </aside>
          <article className="legal-content">
            {sections.map((section, index) => (
              <section id={section.id} className="legal-section" key={section.id}>
                <span className="legal-number">{String(index + 1).padStart(2, "0")}</span>
                <div><h2>{section.title}</h2>{section.content}</div>
              </section>
            ))}
            <div className="provider-note terms-note">
              <Scale size={22} />
              <div>
                <strong>Leitura conjunta</strong>
                <p>Estes termos devem ser lidos junto da Política de Privacidade, que detalha o tratamento de contas, metadados e documentos.</p>
              </div>
            </div>
          </article>
        </div>
      </main>
      <footer className="footer"><div className="shell footer-row"><Brand /><span>© 2026 Converta</span><div className="footer-links"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></div></div></footer>
    </>
  );
}
