export type TopicoDraft = { nome: string };
export type AssuntoDraft = { nome: string; topicos: TopicoDraft[] };
export type DisciplinaDraft = { nome: string; peso: number; assuntos: AssuntoDraft[]; topicos: TopicoDraft[] };

const PESO_PADRAO = 3;

type Linha =
  | { tipo: 'disciplina'; nome: string }
  | { tipo: 'assunto'; nome: string }
  | { tipo: 'topico'; nome: string };

function classificar(bruta: string): Linha | null {
  const linha = bruta.trim();
  if (!linha) return null;

  const num = linha.match(/^(\d+(?:\.\d+)*)[.)]?\s+(.*)$/);
  if (num) {
    const profundidade = num[1].split('.').length;
    const nome = num[2].trim();
    if (profundidade === 1) return { tipo: 'disciplina', nome };
    if (profundidade === 2) return { tipo: 'assunto', nome };
    return { tipo: 'topico', nome };
  }

  const marcador = linha.match(/^[-*•]\s+(.*)$/);
  if (marcador) return { tipo: 'topico', nome: marcador[1].trim() };

  const semAcento = linha.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (semAcento === semAcento.toUpperCase() && /[A-Z]/.test(semAcento)) {
    return { tipo: 'disciplina', nome: linha };
  }
  return { tipo: 'topico', nome: linha };
}

export function parseEditalTexto(texto: string): { disciplinas: DisciplinaDraft[] } {
  const disciplinas: DisciplinaDraft[] = [];
  let disc: DisciplinaDraft | null = null;
  let assunto: AssuntoDraft | null = null;

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = classificar(bruta);
    if (!linha) continue;

    if (linha.tipo === 'disciplina') {
      disc = { nome: linha.nome, peso: PESO_PADRAO, assuntos: [], topicos: [] };
      assunto = null;
      disciplinas.push(disc);
    } else if (linha.tipo === 'assunto') {
      if (!disc) continue;
      assunto = { nome: linha.nome, topicos: [] };
      disc.assuntos.push(assunto);
    } else {
      if (!disc) continue;
      if (assunto) assunto.topicos.push({ nome: linha.nome });
      else disc.topicos.push({ nome: linha.nome });
    }
  }

  // Um nível intermediário só é "assunto" de fato quando possui tópicos aninhados.
  // Sem filhos (ex.: "1.1 Ortografia" isolado), ele é um tópico direto da disciplina.
  for (const d of disciplinas) {
    const comFilhos: AssuntoDraft[] = [];
    for (const a of d.assuntos) {
      if (a.topicos.length > 0) comFilhos.push(a);
      else d.topicos.push({ nome: a.nome });
    }
    d.assuntos = comFilhos;
  }

  return { disciplinas };
}
