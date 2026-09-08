import { z } from 'zod';

export const concursoInputSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do concurso'),
  banca: z.string().trim().optional(),
  cargo: z.string().trim().optional(),
  data_prova: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
});
export type ConcursoInput = z.infer<typeof concursoInputSchema>;

const topicoSchema = z.object({ nome: z.string().trim().min(1) });
const assuntoSchema = z.object({ nome: z.string().trim().min(1), topicos: z.array(topicoSchema) });
const disciplinaSchema = z.object({
  nome: z.string().trim().min(1, 'Disciplina sem nome'),
  peso: z.number().int().min(1).max(5),
  assuntos: z.array(assuntoSchema),
  topicos: z.array(topicoSchema),
});
export const arvoreSchema = z.object({ disciplinas: z.array(disciplinaSchema) });
export type Arvore = z.infer<typeof arvoreSchema>;
