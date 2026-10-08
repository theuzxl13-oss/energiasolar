import type { FaqItem } from "@/types";

export const faqItems: FaqItem[] = [
  {
    id: "economia-solar",
    category: "solar",
    question: "Quanto posso economizar com energia solar?",
    answer:
      "A economia depende do seu consumo, da tarifa da distribuidora, da localização e das condições do telhado ou terreno. Em muitos casos a redução na conta é expressiva, mas sempre permanece uma parcela mínima (custo de disponibilidade e encargos). Use nosso simulador para uma estimativa inicial; o valor definitivo é calculado na proposta técnica.",
  },
  {
    id: "vida-util",
    category: "solar",
    question: "Quanto tempo dura um sistema fotovoltaico?",
    answer:
      "Os módulos fotovoltaicos costumam ter vida útil superior a 25 anos, com garantia de desempenho do fabricante. Os inversores geralmente têm vida útil menor e podem precisar de substituição ao longo do período. Os prazos de garantia variam conforme o fabricante e o modelo escolhido.",
  },
  {
    id: "dias-nublados",
    category: "solar",
    question: "Energia solar funciona em dias nublados?",
    answer:
      "Sim. Em dias nublados a geração diminui, mas não para, porque os módulos também aproveitam a luz difusa. O sistema é dimensionado considerando a média anual de irradiação da sua região, e os créditos gerados nos dias de maior produção compensam os períodos de menor geração.",
  },
  {
    id: "carregar-em-casa",
    category: "carregadores",
    question: "Posso carregar meu carro elétrico em casa?",
    answer:
      "Sim, e essa é a forma mais comum de recarga. O ideal é instalar um wallbox em circuito dedicado, com proteções adequadas. Uma tomada comum pode até funcionar em alguns casos, mas é mais lenta e não é recomendada para uso diário sem avaliação da instalação elétrica.",
  },
  {
    id: "tempo-recarga",
    category: "carregadores",
    question: "Quanto tempo demora para carregar um veículo elétrico?",
    answer:
      "Depende da capacidade da bateria, da potência do carregador e do limite de recarga do próprio veículo. Como referência, um wallbox de 7,4 kW recarrega a maioria dos carros durante a noite, enquanto carregadores DC rápidos podem recuperar boa parte da bateria em menos de uma hora.",
  },
  {
    id: "aumento-carga",
    category: "carregadores",
    question: "Preciso aumentar a carga elétrica da minha residência?",
    answer:
      "Nem sempre. Avaliamos o padrão de entrada, a potência disponível e o consumo atual. Em alguns casos é possível instalar com gestão de carga; em outros, pode ser necessário solicitar aumento de carga à distribuidora. Essa definição só é possível após a análise técnica.",
  },
  {
    id: "condominio",
    category: "carregadores",
    question: "É possível instalar carregadores em condomínio?",
    answer:
      "Sim. Desenvolvemos projetos coletivos com medição individualizada e balanceamento de carga, de modo que cada morador pague pela própria energia. O projeto também apoia a apresentação em assembleia e a adequação às regras internas do condomínio.",
  },
  {
    id: "o-que-e-eletroposto",
    category: "eletropostos",
    question: "O que é um eletroposto?",
    answer:
      "É uma estação de recarga para veículos elétricos aberta a usuários, instalada em locais como postos, shoppings, hotéis, estacionamentos e rodovias. Pode contar com carregadores AC, DC ou ambos, além de plataforma de gestão e cobrança.",
  },
  {
    id: "custo-eletroposto",
    category: "eletropostos",
    question: "Quanto custa montar um eletroposto?",
    answer:
      "O investimento varia bastante conforme a quantidade de pontos, a potência dos carregadores (AC ou DC), as adequações de infraestrutura elétrica e as obras civis necessárias. Por isso, o valor é definido após o estudo técnico do local, quando apresentamos uma proposta detalhada.",
  },
  {
    id: "cobrar-recarga",
    category: "eletropostos",
    question: "É possível cobrar pela recarga?",
    answer:
      "Sim. Plataformas de gestão permitem cobrança por energia consumida, por tempo ou por assinatura, com pagamento por aplicativo. O modelo de cobrança deve observar a regulamentação vigente, e orientamos a configuração mais adequada ao seu negócio.",
  },
];
