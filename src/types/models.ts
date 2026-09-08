export type TopicoLite = { id: string; disciplinaId: string; concluido: boolean };
export type DisciplinaLite = { id: string; nome: string; peso: number };
export type SessaoEstudoLite = { topicoId: string; duracaoSegundos: number; iniciadaEm: string };
export type SessaoExercicioLite = { topicoId: string; acertos: number; erros: number; data: string };
