import type {
  TopicoLite, DisciplinaLite, SessaoEstudoLite, SessaoExercicioLite,
} from '@/types/models';

const pesoValido = (p: number) => (Number.isInteger(p) && p >= 1 && p <= 5 ? p : 3);

export function coberturaEdital(topicos: TopicoLite[]): { geral: number; porDisciplina: Map<string, number> } {
  const porDisciplina = new Map<string, number>();
  const agrupado = new Map<string, { total: number; feitos: number }>();
  for (const t of topicos) {
    const g = agrupado.get(t.disciplinaId) ?? { total: 0, feitos: 0 };
    g.total += 1;
    if (t.concluido) g.feitos += 1;
    agrupado.set(t.disciplinaId, g);
  }
  for (const [id, g] of agrupado) porDisciplina.set(id, g.total ? g.feitos / g.total : 0);
  const geral = topicos.length ? topicos.filter((t) => t.concluido).length / topicos.length : 0;
  return { geral, porDisciplina };
}

export function coberturaPonderada(disciplinas: DisciplinaLite[], topicos: TopicoLite[]): number {
  const { porDisciplina } = coberturaEdital(topicos);
  let num = 0;
  let den = 0;
  for (const d of disciplinas) {
    if (!porDisciplina.has(d.id)) continue; // sem tópicos: ignora
    const w = pesoValido(d.peso);
    num += w * (porDisciplina.get(d.id) ?? 0);
    den += w;
  }
  return den ? num / den : 0;
}

export function aproveitamento(
  sessoes: SessaoExercicioLite[], topicos: TopicoLite[],
): { geral: number | null; porDisciplina: Map<string, number | null> } {
  const discDoTopico = new Map(topicos.map((t) => [t.id, t.disciplinaId]));
  const porDisc = new Map<string, { acertos: number; total: number }>();
  let acertosGeral = 0;
  let totalGeral = 0;
  for (const s of sessoes) {
    const total = s.acertos + s.erros;
    acertosGeral += s.acertos;
    totalGeral += total;
    const did = discDoTopico.get(s.topicoId);
    if (!did) continue;
    const g = porDisc.get(did) ?? { acertos: 0, total: 0 };
    g.acertos += s.acertos;
    g.total += total;
    porDisc.set(did, g);
  }
  const porDisciplina = new Map<string, number | null>();
  const disciplinasVistas = new Set(topicos.map((t) => t.disciplinaId));
  for (const did of disciplinasVistas) {
    const g = porDisc.get(did);
    porDisciplina.set(did, g && g.total ? g.acertos / g.total : null);
  }
  return { geral: totalGeral ? acertosGeral / totalGeral : null, porDisciplina };
}

export function tempoEstudado(
  sessoes: SessaoEstudoLite[], topicos: TopicoLite[], agora: Date = new Date(),
): { totalSegundos: number; porDisciplina: Map<string, number>; ultimos7diasSegundos: number } {
  const discDoTopico = new Map(topicos.map((t) => [t.id, t.disciplinaId]));
  const corte = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
  const porDisciplina = new Map<string, number>();
  let totalSegundos = 0;
  let ultimos7diasSegundos = 0;
  for (const s of sessoes) {
    totalSegundos += s.duracaoSegundos;
    if (new Date(s.iniciadaEm).getTime() >= corte) ultimos7diasSegundos += s.duracaoSegundos;
    const did = discDoTopico.get(s.topicoId);
    if (!did) continue;
    porDisciplina.set(did, (porDisciplina.get(did) ?? 0) + s.duracaoSegundos);
  }
  return { totalSegundos, porDisciplina, ultimos7diasSegundos };
}
