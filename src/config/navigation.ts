export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export const mainNavigation: NavItem[] = [
  { label: "Energia Solar", href: "/energia-solar", description: "Sistemas fotovoltaicos sob medida" },
  { label: "Carregadores", href: "/carregadores", description: "Wallbox, AC e DC" },
  { label: "Eletropostos", href: "/eletropostos", description: "Estações de recarga comerciais" },
  { label: "Projetos", href: "/projetos", description: "Portfólio de soluções" },
  { label: "Sobre", href: "/sobre", description: "Quem somos" },
  { label: "Contato", href: "/contato", description: "Fale com a equipe" },
];

export const footerNavigation = {
  solucoes: [
    { label: "Energia Solar Residencial", href: "/energia-solar#segmentos" },
    { label: "Energia Solar Empresarial", href: "/energia-solar#segmentos" },
    { label: "Wallbox Residencial", href: "/carregadores#residencial" },
    { label: "Carregadores para Condomínios", href: "/carregadores#condominios" },
    { label: "Eletropostos", href: "/eletropostos" },
    { label: "Manutenção e Suporte", href: "/orcamento?servico=manutencao" },
  ],
  empresa: [
    { label: "Sobre a empresa", href: "/sobre" },
    { label: "Projetos", href: "/projetos" },
    { label: "Perguntas frequentes", href: "/#faq" },
    { label: "Contato", href: "/contato" },
    { label: "Política de Privacidade", href: "/politica-de-privacidade" },
  ],
  ferramentas: [
    { label: "Simulador de economia solar", href: "/#simulador-solar" },
    { label: "Simulador de carregador", href: "/#simulador-carregador" },
    { label: "Solicitar orçamento", href: "/orcamento" },
  ],
} satisfies Record<string, NavItem[]>;
