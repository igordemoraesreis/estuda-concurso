import { z } from 'zod';

export const sessaoExercicioSchema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD'),
    acertos: z.number().int().min(0, 'Não pode ser negativo'),
    erros: z.number().int().min(0, 'Não pode ser negativo'),
    nota: z.string().trim().optional(),
  })
  .refine((v) => v.acertos + v.erros > 0, {
    message: 'Informe ao menos uma questão',
    path: ['acertos'],
  });

export type SessaoExercicioInput = z.infer<typeof sessaoExercicioSchema>;
