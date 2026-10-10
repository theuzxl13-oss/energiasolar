import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Container, Section } from "@/components/ui/primitives";
import { CompanyText } from "@/components/ui/site-content";
import { PageHero } from "@/components/sections/page-hero";

export const metadata = buildMetadata({
  title: "Política de Privacidade",
  description: `Como a ${siteConfig.name} coleta, utiliza e protege os dados pessoais enviados pelo site, em conformidade com a LGPD.`,
  path: "/politica-de-privacidade",
});

/**
 * Modelo de política de privacidade. Deve ser revisado pelo jurídico da
 * empresa antes da publicação em produção.
 */
export default function PrivacidadePage() {
  return (
    <>
      <PageHero
        eyebrow="LGPD"
        title="Política de Privacidade"
        description="Transparência sobre como tratamos os dados pessoais enviados pelo site."
        breadcrumb={[{ name: "Política de Privacidade", path: "/politica-de-privacidade" }]}
      />
      <Section>
        <Container className="max-w-3xl">
          <p className="border-l-2 border-spark pl-4 text-sm font-extralight text-spark">
            Documento modelo para a versão demonstrativa. Deve ser revisado e validado pelo responsável jurídico da empresa antes da publicação.
          </p>
          <div className="mt-10 space-y-8 text-lg leading-relaxed font-extralight text-mist [&_h2]:text-2xl [&_h2]:text-white">
            <section>
              <h2>1. Quem somos</h2>
              <p className="mt-2">
                <CompanyText field="legalName" />, inscrita no CNPJ <CompanyText field="cnpj" />, é a controladora dos dados pessoais coletados por
                este site. Contato: <CompanyText field="email" />.
              </p>
            </section>
            <section>
              <h2>2. Dados coletados</h2>
              <p className="mt-2">
                Coletamos os dados informados voluntariamente nos formulários de orçamento e contato e no chat: nome, telefone/WhatsApp, e-mail,
                cidade, estado, informações sobre o imóvel, consumo de energia, veículos e a mensagem enviada.
              </p>
            </section>
            <section>
              <h2>3. Finalidade</h2>
              <p className="mt-2">
                Os dados são utilizados exclusivamente para responder às solicitações, elaborar propostas técnicas e comerciais e prestar suporte
                aos serviços contratados, com base no consentimento e no procedimento preliminar a contrato (LGPD, art. 7º, I e V).
              </p>
            </section>
            <section>
              <h2>4. Compartilhamento</h2>
              <p className="mt-2">
                Não vendemos dados pessoais. O compartilhamento ocorre apenas com fornecedores necessários à operação (hospedagem, banco de dados e
                comunicação), sob obrigações de confidencialidade e segurança.
              </p>
            </section>
            <section>
              <h2>5. Armazenamento e segurança</h2>
              <p className="mt-2">
                Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados. Os dados são mantidos pelo tempo
                necessário ao atendimento ou ao cumprimento de obrigações legais.
              </p>
            </section>
            <section>
              <h2>6. Seus direitos</h2>
              <p className="mt-2">
                Você pode solicitar confirmação, acesso, correção, anonimização, portabilidade ou eliminação dos seus dados, além de revogar o
                consentimento, pelo e-mail <CompanyText field="email" />.
              </p>
            </section>
            <section>
              <h2>7. Cookies</h2>
              <p className="mt-2">
                Este site utiliza apenas recursos técnicos essenciais ao funcionamento. Caso ferramentas de análise sejam adicionadas, esta política
                será atualizada e o consentimento será solicitado quando necessário.
              </p>
            </section>
          </div>
        </Container>
      </Section>
    </>
  );
}
