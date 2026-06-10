import { SiteHeader } from "@/components/layout/site-header";

export default function TermsPage() {
  return <><SiteHeader /><main className="legal"><h1>Termos de uso</h1><p>Última atualização: 10 de junho de 2026.</p><h2>Uso permitido</h2><p>Use o serviço apenas para arquivos que você tem autorização para processar. Não envie conteúdo ilegal, malicioso ou que viole direitos de terceiros.</p><h2>Limitações</h2><p>Conversões podem alterar formatação, especialmente em PDFs complexos. O serviço depende de Firebase, Vercel e CloudConvert e pode ficar indisponível.</p><h2>Responsabilidade</h2><p>Mantenha cópias dos arquivos originais. O Converta não deve ser usado como armazenamento permanente e não garante preservação integral de layout ou conteúdo.</p></main></>;
}
