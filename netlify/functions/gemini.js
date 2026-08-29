// netlify/functions/gemini.cjs

const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Domínios confiáveis para pesquisa jurídica/acadêmica
const DOMINIOS_CONFIAVEIS = [
  "planalto.gov.br",
  "stf.jus.br",
  "stj.jus.br",
  "jusbrasil.com.br",
  "lexml.gov.br",
  "camara.leg.br",
  "senado.leg.br",
  "scielo.org",
  "scielo.br",
  "gov.br",
  "jus.br",
  "leg.br",
];

function fonteConfiavel(url) {
  if (!url) return false;
  return DOMINIOS_CONFIAVEIS.some((dominio) => url.includes(dominio));
}

const MENSAGEM_FALLBACK = "Infelizmente não encontramos esse artigo :(";

function montarInstrucao(mode) {
  const base = `
Você é Loy, um assistente jurídico. Responda APENAS com base em resultados reais de busca (Google Search grounding).

REGRAS OBRIGATÓRIAS:
1. NUNCA cite artigo, lei, súmula ou jurisprudência que não tenha vindo de uma fonte real encontrada na busca.
2. NUNCA invente número de artigo, nome de lei, data ou link.
3. Toda citação de artigo/lei DEVE vir acompanhada do nome da fonte.
4. Se não houver nenhuma fonte confiável relevante à pergunta, responda apenas:
"${MENSAGEM_FALLBACK}"
5. Explique o conteúdo encontrado em linguagem acessível, sem adicionar fatos que não estejam nas fontes.
6. Não dê opinião jurídica pessoal nem preveja resultado de processo.
`;

  if (mode === "academica") {
    return base + `\n7. Foco em artigos acadêmicos, doutrina e produção científica sobre Direito.`;
  }

  if (mode === "outros") {
    return base + `\n7. Foco em explicações didáticas sobre conceitos e princípios de Direito, sempre embasadas em fontes reais.`;
  }

  // juridica (padrão)
  return base + `\n7. Foco em leis, jurisprudência, súmulas e normas jurídicas — nada fora desse escopo.`;
}

exp
