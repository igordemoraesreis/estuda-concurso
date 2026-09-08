import { agruparRevisao, diasEntre } from '../hooks';

// `../hooks` importa `@/lib/supabase` no topo do módulo; mockado para não exigir env.
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

test('diasEntre conta dias inteiros', () => {
  expect(diasEntre('2026-09-01T12:00:00Z', new Date('2026-09-11T12:00:00Z'))).toBe(10);
});

test('agrupa no maior limiar aplicável e ignora recentes', () => {
  const agora = new Date('2026-09-30T12:00:00Z');
  const topicos = [
    { topicoId: 't1', nome: 'Antigo', disciplinaNome: 'D', concluidoEm: '2026-08-15T12:00:00Z' }, // 46 dias -> 30
    { topicoId: 't2', nome: 'Médio', disciplinaNome: 'D', concluidoEm: '2026-09-10T12:00:00Z' }, // 20 dias -> 15
    { topicoId: 't3', nome: 'Recente', disciplinaNome: 'D', concluidoEm: '2026-09-28T12:00:00Z' }, // 2 dias -> nenhum
  ];
  const grupos = agruparRevisao(topicos, [7, 15, 30], agora);
  expect(grupos.map((g) => g.limiarDias)).toEqual([30, 15]);
  expect(grupos[0].itens[0].topicoId).toBe('t1');
  expect(grupos[1].itens[0].topicoId).toBe('t2');
});

test('itens dentro do grupo ordenados por diasDesde desc', () => {
  const agora = new Date('2026-09-30T12:00:00Z');
  const topicos = [
    { topicoId: 'a', nome: 'A', disciplinaNome: 'D', concluidoEm: '2026-09-01T12:00:00Z' }, // 29 dias -> 15
    { topicoId: 'b', nome: 'B', disciplinaNome: 'D', concluidoEm: '2026-08-20T12:00:00Z' }, // 41 dias -> 30
    { topicoId: 'c', nome: 'C', disciplinaNome: 'D', concluidoEm: '2026-09-10T12:00:00Z' }, // 20 dias -> 15
  ];
  const grupos = agruparRevisao(topicos, [7, 15, 30], agora);
  expect(grupos.map((g) => g.limiarDias)).toEqual([30, 15]);
  expect(grupos[1].itens.map((i) => i.topicoId)).toEqual(['a', 'c']);
  expect(grupos[1].itens[0].diasDesde).toBeGreaterThan(grupos[1].itens[1].diasDesde);
});

test('sem tópicos aplicáveis retorna lista vazia', () => {
  const agora = new Date('2026-09-30T12:00:00Z');
  const topicos = [
    { topicoId: 't', nome: 'T', disciplinaNome: 'D', concluidoEm: '2026-09-29T12:00:00Z' }, // 1 dia
  ];
  expect(agruparRevisao(topicos, [7, 15, 30], agora)).toEqual([]);
});
