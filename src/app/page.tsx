import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Download, LockKeyhole, ShieldCheck, Upload } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Brand } from "@/components/layout/brand";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Seu documento, no formato certo</span>
            <h1>Converta PDF e DOCX sem complicação.</h1>
            <p>Uma ferramenta direta para trabalhos, resumos e documentos. Seus arquivos ficam privados e o histórico permanece organizado.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/login">Converter arquivo <ArrowRight size={18} /></Link>
              <Link className="button button-secondary" href="#como-funciona">Ver como funciona</Link>
            </div>
            <div className="hero-note">
              <span><Check size={15} /> Gratuito para começar</span>
              <span><LockKeyhole size={15} /> Arquivos privados</span>
              <span><Clock3 size={15} /> Exclusão após 7 dias</span>
            </div>
          </div>
          <div className="hero-image">
            <Image src="/images/student-desk.png" alt="Mesa de estudos organizada com notebook e documentos" fill priority sizes="(max-width: 850px) 100vw, 50vw" />
            <div className="format-float"><span className="format-chip">DOCX</span><ArrowRight size={16} /><span className="format-chip">PDF</span></div>
          </div>
        </section>

        <section className="band" id="como-funciona">
          <div className="shell">
            <div className="section-head">
              <span className="eyebrow">Três passos</span>
              <h2>Do arquivo ao download, sem desvio.</h2>
              <p>O formato de saída é detectado automaticamente. Você acompanha cada etapa e recebe o arquivo assim que ele fica pronto.</p>
            </div>
            <div className="steps">
              <article className="step"><span className="step-number">01</span><h3>Envie</h3><p>Arraste um PDF ou DOCX de até 20 MB. O upload vai direto para o armazenamento privado.</p></article>
              <article className="step"><span className="step-number">02</span><h3>Converta</h3><p>O processamento acontece em um provedor especializado, com status atualizado em tempo real.</p></article>
              <article className="step"><span className="step-number">03</span><h3>Baixe</h3><p>Faça o download imediatamente ou volte ao histórico enquanto o arquivo estiver disponível.</p></article>
            </div>
          </div>
        </section>

        <section className="band band-alt">
          <div className="shell">
            <div className="section-head"><span className="eyebrow">Feito para a rotina</span><h2>Menos tempo ajustando arquivos. Mais tempo no conteúdo.</h2></div>
            <div className="benefits">
              <div className="benefit"><span className="benefit-icon"><Upload size={20} /></span><div><h3>Upload direto</h3><p>Arquivos grandes não passam pelo corpo da aplicação, reduzindo falhas no envio.</p></div></div>
              <div className="benefit"><span className="benefit-icon"><Download size={20} /></span><div><h3>Histórico útil</h3><p>Encontre, baixe novamente ou exclua cada conversão em poucos cliques.</p></div></div>
              <div className="benefit"><span className="benefit-icon"><ShieldCheck size={20} /></span><div><h3>Acesso protegido</h3><p>As regras vinculam documentos e arquivos à conta autenticada.</p></div></div>
              <div className="benefit"><span className="benefit-icon"><LockKeyhole size={20} /></span><div><h3>Privacidade clara</h3><p>Arquivos privados, exclusão manual e limpeza automática programada.</p></div></div>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="shell footer-row"><Brand /><span>© 2026 Converta</span><div className="footer-links"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></div></div></footer>
    </>
  );
}
