/**
 * Datas do app são "dias civis" (AAAA-MM-DD) no fuso do usuário.
 *
 * `new Date('2026-09-01')` é interpretado como meia-noite UTC; em UTC-3 isso vira
 * 31/08 às 21h e a data aparece um dia antes. Por isso todo parse/format de data
 * civil passa por aqui, construindo a data com os componentes locais.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Data de hoje no fuso local, em AAAA-MM-DD. */
export function hojeISO(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${pad2(agora.getMonth() + 1)}-${pad2(agora.getDate())}`;
}

/**
 * Formata AAAA-MM-DD (ou um timestamp ISO completo) como DD/MM/AAAA no fuso local.
 * Devolve a própria entrada se ela não for uma data reconhecível.
 */
export function formatarDataBR(iso: string): string {
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (soData) {
    const [, y, m, d] = soData;
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR');
  }
  // Timestamp completo (ex.: `iniciada_em`): tem fuso próprio, converte para o local.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}
