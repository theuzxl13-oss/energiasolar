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
                Coletamos os dados informados voluntariamente nos formulários de orçamento e contato: nome, telefone/WhatsApp, e-mail, cidade,
                estado, informações sobre o imóvel, consumo de energia, veículos e a mensagem enviada. No chat, coletamos apenas as mensagens
                digitadas; pedimos que você <strong>não informe dados pessoais no chat</strong> e use o formulário ou o WhatsApp para isso.
              </p>
              <p className="mt-2">
                Para proteger os formulários contra robôs, a verificação “não sou robô” coleta sinais técnicos do navegador e o endereço IP, usados
                somente para essa finalidade.
              </p>
            </section>
            <section>
              <h2>3. Finalidade</h2>
              <p className="mt-2">
                Os dados são utilizados exclusivamente para responder às solicitações, elaborar propostas técnicas e comerciais, prestar suporte aos
                serviços contratados e proteger o site contra fraudes e abusos, com base no consentimento, no procedimento preliminar a contrato e
                no legítimo interesse (LGPD, art. 7º, I, V e IX).
              </p>
            </section>
            <section>
              <h2>4. Compartilhamento com fornecedores</h2>
              <p className="mt-2">
                Não vendemos dados pessoais. Eles são tratados apenas pelos fornecedores necessários à operação do site, sob obrigações de
                confidencialidade e segurança:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>
                  <strong>Cloudflare</strong>: hospedagem do site e verificação “não sou robô” (Turnstile).
                </li>
                <li>
                  <strong>Supabase</strong>: banco de dados onde ficam os pedidos de orçamento e contato.
                </li>
                <li>
                  <strong>Google (Gemini)</strong>: inteligência artificial que gera as respostas do chat. As mensagens digitadas no chat são
                  enviadas ao Google para gerar a resposta. No plano utilizado, o Google pode usar esse conteúdo para melhorar seus produtos, e ele
                  pode ser lido por revisores humanos. Por isso, não informe dados pessoais ou confidenciais no chat. As respostas do chat são
                  automáticas, podem conter imprecisões e não substituem a análise técnica da nossa equipe.
                </li>
                <li>
                  <strong>Resend</strong>: envio do backup periódico dos dados para o e-mail da própria empresa.
                </li>
              </ul>
            </section>
            <section>
              <h2>5. Transferência internacional</h2>
              <p className="mt-2">
                Alguns desses fornecedores armazenam ou processam dados em servidores fora do Brasil. Nesses casos, a transferência ocorre com
                garantias de proteção compatíveis com a LGPD (art. 33), como cláusulas contratuais dos próprios fornecedores.
              </p>
            </section>
            <section>
              <h2>6. Armazenamento e segurança</h2>
              <p className="mt-2">
                Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, como conexão criptografada
                (HTTPS), acesso restrito à equipe autorizada com verificação em duas etapas e regras de permissão no banco de dados. Os dados são
                mantidos pelo tempo necessário ao atendimento ou ao cumprimento de obrigações legais.
              </p>
            </section>
            <section>
              <h2>7. Seus direitos</h2>
              <p className="mt-2">
                Você pode solicitar confirmação, acesso, correção, anonimização, portabilidade ou eliminação dos seus dados, além de revogar o
                consentimento, pelo e-mail <CompanyText field="email" />.
              </p>
            </section>
            <section>
              <h2>8. Cookies e armazenamento no navegador</h2>
              <p className="mt-2">
                Este site utiliza apenas recursos técnicos essenciais ao funcionamento, como a preferência de tema (claro/escuro) e a verificação
                “não sou robô”. Não usamos cookies de publicidade. Caso ferramentas de análise sejam adicionadas, esta política será atualizada e o
                consentimento será solicitado quando necessário.
              </p>
            </section>
            <p className="text-sm text-ash">Última atualização: outubro de 2026.</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
