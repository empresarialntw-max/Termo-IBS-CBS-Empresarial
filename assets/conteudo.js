/* ==================================================================
   CONFIGURAÇÃO E CONTEÚDO DO TERMO
   Empresarial Assessoria Contábil

   ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR no dia a dia.
   Aqui ficam o endereço de envio, o modo demonstração, os textos
   jurídicos, a base legal e as datas dos prazos.

   Depois de editar, salve e faça o commit — o GitHub Pages publica
   sozinho em cerca de um minuto.
   ================================================================== */

window.CONFIG = {
  /* ----------------------------------------------------------------
     MODO DEMONSTRAÇÃO
     true  = o formulário funciona por completo, gera o PDF, mas NÃO
             envia nada ao escritório. Use para treinar a equipe e
             para conferir o documento.
     false = envio ligado. Só mude para false depois de publicar o
             Apps Script e colar o endereço em ENDPOINT abaixo.
     ---------------------------------------------------------------- */
  MODO_DEMO: true,

  /* ----------------------------------------------------------------
     ENDEREÇO DE ENVIO
     Cole aqui a URL do aplicativo da Web gerada pelo Google Apps
     Script (ver apps-script/Codigo.gs e o README).
     Formato: https://script.google.com/macros/s/AKfycb.../exec
     ---------------------------------------------------------------- */
  ENDPOINT: '',

  /* Quem recebe o termo. Só aparece nos textos da tela — o destino
     real é definido dentro do Apps Script. */
  EMAIL_ESCRITORIO: 'contato@empresarialsc.com.br'
};

/* ------------------------------------------------------------------
   CONTEÚDO DO TERMO
   Textos, base legal e prazos. Formulário e PDF leem daqui, então
   alterar um texto muda a tela e o documento ao mesmo tempo.
   ------------------------------------------------------------------ */

window.CONTEUDO = {
  "versaoConteudo": "1.0",
  "vigenteEm": "2026-09-08",
  "escritorio": {
    "nome": "Empresarial Assessoria Contábil",
    "nomeCurto": "Empresarial",
    "endereco": "R. dos Guajajaras, 40, sala 605 — Centro, Belo Horizonte/MG",
    "emailDestino": "contato@empresarialsc.com.br",
    "site": "empresarialsc.com.br"
  },
  "documento": {
    "titulo": "Termo de Ciência e Decisão do Cliente",
    "subtitulo": "Reforma Tributária — IBS e CBS",
    "linhaFina": "Empresas optantes pelo Simples Nacional",
    "prefixoProtocolo": "EMP-IBSCBS"
  },
  "prazos": {
    "formalizacao": {
      "inicio": "2026-09-01",
      "fim": "2026-09-30",
      "rotulo": "Período inicial de opção: 01/09/2026 a 30/09/2026",
      "observacao": "O prazo deverá ser observado conforme a legislação e a regulamentação vigentes. A opção é exercida pela empresa no Portal do Simples Nacional; este formulário registra a decisão perante a Empresarial Assessoria Contábil."
    },
    "reconsideracao": {
      "possuiPrazoDefinido": true,
      "data": "2026-11-30",
      "rotulo": "Prazo para cancelamento da opção: até 30/11/2026",
      "fundamento": "Resolução CGSN nº 186/2026",
      "observacao": "Confirme a redação vigente do ato antes de cada campanha. Se a regulamentação deixar de prever prazo específico, altere possuiPrazoDefinido para false — o quadro passa a exibir apenas o texto genérico."
    }
  },
  "contexto": {
    "titulo": "Entenda o contexto da sua decisão",
    "paragrafos": [
      "A Reforma Tributária sobre o consumo promoveu alterações relevantes no sistema tributário brasileiro, incluindo a criação da Contribuição sobre Bens e Serviços – CBS e do Imposto sobre Bens e Serviços – IBS.",
      "As regras relacionadas à Reforma Tributária decorrem, entre outras normas, da Emenda Constitucional nº 132/2023 e da Lei Complementar nº 214/2025.",
      "Para as empresas optantes pelo Simples Nacional, foram estabelecidas regras específicas relacionadas à forma de recolhimento do IBS e da CBS, permitindo que a empresa avalie a manutenção do recolhimento dentro do regime do Simples Nacional ou, quando aplicável, a opção pelo recolhimento desses tributos pelo regime regular.",
      "Essa decisão deve considerar as características e particularidades de cada empresa, incluindo seu perfil de clientes, operações, possibilidade de aproveitamento de créditos e potenciais impactos tributários, financeiros, comerciais e operacionais.",
      "A Empresarial Assessoria Contábil realizou previamente a análise técnica da empresa e apresentou ao cliente as orientações e recomendações aplicáveis ao seu caso.",
      "Este formulário tem exclusivamente a finalidade de registrar a ciência e formalizar a decisão da empresa."
    ]
  },
  "baseLegal": {
    "titulo": "Base legal e regulamentação",
    "itens": [
      {
        "norma": "Emenda Constitucional nº 132/2023",
        "descricao": "Estabelece a Reforma Tributária sobre o consumo e a base constitucional para a instituição do IBS e da CBS."
      },
      {
        "norma": "Lei Complementar nº 214/2025",
        "descricao": "Regulamenta aspectos da tributação sobre o consumo relacionados ao IBS e à CBS."
      },
      {
        "norma": "Lei Complementar nº 123/2006",
        "descricao": "Estabelece as normas gerais relativas ao Simples Nacional."
      },
      {
        "norma": "Resolução CGSN nº 186/2026 e demais normas regulamentares aplicáveis",
        "descricao": "Estabelecem regras e procedimentos relacionados à adequação do Simples Nacional às alterações decorrentes da Reforma Tributária, incluindo os procedimentos relacionados à escolha do modelo de recolhimento."
      }
    ]
  },
  "decisao": {
    "chamada": "Após a análise técnica realizada pela Empresarial Assessoria Contábil, a empresa deverá formalizar sua decisão entre as alternativas aplicáveis ao seu caso. Nesta etapa as alternativas são apresentadas apenas para leitura; a escolha ocorre na etapa de formalização.",
    "opcoes": [
      {
        "id": "SIMPLES_NACIONAL",
        "letra": "A",
        "titulo": "Manutenção do recolhimento no Simples Nacional",
        "explicativo": "A empresa decide permanecer com o modelo de recolhimento aplicável ao Simples Nacional, sem realizar a opção pelo recolhimento do IBS e da CBS pelo regime regular.",
        "manifestacao": "A empresa manifesta sua decisão de permanecer com o modelo de recolhimento aplicável ao Simples Nacional, sem realizar a opção pelo recolhimento do IBS e da CBS pelo regime regular."
      },
      {
        "id": "REGIME_REGULAR",
        "letra": "B",
        "titulo": "Recolhimento do IBS e da CBS pelo regime regular",
        "explicativo": "A empresa decide optar pelo recolhimento do IBS e da CBS pelo regime regular, observadas as regras e procedimentos estabelecidos pela legislação e regulamentação aplicáveis.",
        "manifestacao": "A empresa manifesta sua decisão de optar pelo recolhimento do IBS e da CBS pelo regime regular, conforme as regras e procedimentos estabelecidos pela legislação aplicável."
      }
    ],
    "atencao": "A opção selecionada será registrada como manifestação formal da empresa."
  },
  "reconsideracaoTexto": {
    "titulo": "Prazo para reconsideração ou cancelamento da opção",
    "paragrafos": [
      "Após a formalização da decisão, a legislação e a regulamentação aplicáveis poderão estabelecer prazo específico para cancelamento ou reconsideração da opção pelo regime regular de recolhimento do IBS e da CBS.",
      "Quando houver previsão regulamentar, a empresa deverá observar rigorosamente o prazo estabelecido para eventual cancelamento ou revisão da opção."
    ]
  },
  "alerta": {
    "titulo": "Importante",
    "paragrafos": [
      "A decisão formalizada neste formulário representa a manifestação da empresa após o recebimento das informações e orientações previamente apresentadas pela Empresarial Assessoria Contábil.",
      "Recomenda-se que o responsável pela empresa revise cuidadosamente as informações antes de confirmar sua decisão.",
      "Eventual possibilidade de reconsideração ou cancelamento deverá observar as condições e os prazos previstos na legislação e regulamentação aplicáveis."
    ],
    "checkbox": "Declaro que tomei ciência do contexto, das informações e dos prazos apresentados nesta etapa."
  },
  "ciencia": {
    "titulo": "Termo de ciência",
    "itens": [
      {
        "id": "informacoes",
        "declaracao": "Declaro que fui informado(a) pela Empresarial Assessoria Contábil sobre as alterações decorrentes da Reforma Tributária relacionadas ao IBS e à CBS e sobre as possibilidades de recolhimento aplicáveis às empresas optantes pelo Simples Nacional.",
        "checkbox": "Declaro que recebi as informações e orientações necessárias para compreensão das opções apresentadas."
      },
      {
        "id": "impactos",
        "declaracao": "Declaro que estou ciente de que a decisão adotada poderá gerar impactos tributários, financeiros, comerciais e operacionais para a empresa.",
        "checkbox": "Estou ciente dos possíveis impactos decorrentes da decisão adotada pela empresa."
      },
      {
        "id": "orientacaoPrevia",
        "declaracao": "Declaro que a análise técnica e as orientações relacionadas à empresa foram previamente apresentadas pela Empresarial Assessoria Contábil.",
        "checkbox": "Confirmo que recebi previamente as orientações técnicas relacionadas à decisão."
      }
    ]
  },
  "declaracaoFinal": {
    "titulo": "Declaração de ciência e decisão",
    "paragrafos": [
      "Declaro, na qualidade de responsável pela empresa identificada neste formulário, que recebi as informações e orientações necessárias relacionadas à decisão apresentada.",
      "Declaro estar ciente de que a Empresarial Assessoria Contábil realizou previamente a análise e orientação técnica aplicável à empresa.",
      "Após tomar ciência das informações apresentadas, manifesto formalmente a decisão selecionada neste formulário.",
      "Declaro que as informações fornecidas são verdadeiras e que possuo poderes ou autorização para representar a empresa nesta manifestação."
    ],
    "checkbox": "Li e concordo com a declaração acima."
  },
  "formalizacao": {
    "titulo": "Formalização da decisão",
    "chamada": "Após receber as informações e orientações relacionadas à empresa, manifesto formalmente a decisão da empresa em relação ao modelo de recolhimento do IBS e da CBS."
  },
  "pdf": {
    "resumoContexto": [
      "A Reforma Tributária sobre o consumo instituiu a Contribuição sobre Bens e Serviços (CBS) e o Imposto sobre Bens e Serviços (IBS), com fundamento na Emenda Constitucional nº 132/2023 e na Lei Complementar nº 214/2025.",
      "Para as empresas optantes pelo Simples Nacional, a regulamentação permite avaliar a manutenção do recolhimento do IBS e da CBS dentro do regime do Simples Nacional ou, quando aplicável, a opção pelo recolhimento desses tributos pelo regime regular, nos termos da Lei Complementar nº 123/2006 e da Resolução CGSN nº 186/2026.",
      "A Empresarial Assessoria Contábil realizou previamente a análise técnica da empresa e apresentou ao responsável as orientações e recomendações aplicáveis ao caso concreto. O presente termo registra exclusivamente a ciência do cliente e a manifestação formal da decisão da empresa, não constituindo, por si só, o exercício da opção perante os órgãos competentes."
    ],
    "rodape": "Empresarial Assessoria Contábil — R. dos Guajajaras, 40, sala 605 — Centro, Belo Horizonte/MG — contato@empresarialsc.com.br",
    "avisoAutenticidade": "Documento gerado eletronicamente. A autenticidade pode ser verificada junto à Empresarial Assessoria Contábil mediante informação do número de protocolo e do código de verificação impressos neste termo."
  },
  "privacidade": {
    "aviso": "Os dados informados neste formulário, incluindo CPF e assinatura, são coletados exclusivamente para a formalização e a guarda documental da decisão, nos termos da Lei nº 13.709/2018 (LGPD), e serão tratados pela Empresarial Assessoria Contábil na condição de controladora, pelo prazo necessário ao cumprimento das obrigações legais e regulatórias aplicáveis.",
    "checkboxRotulo": "Estou ciente do tratamento dos dados informados, conforme o aviso acima."
  }
};
