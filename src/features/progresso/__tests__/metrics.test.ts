import { coberturaEdital, coberturaPonderada, aproveitamento, tempoEstudado } from '../metrics';
import type { TopicoLite, DisciplinaLite, SessaoExercicioLite, SessaoEstudoLite } from '@/types/models';

const D = (id: string, peso: number): DisciplinaLite => ({ id, nome: id, peso });
const T = (id: string, disciplinaId: string, concluido: boolean): TopicoLite => ({ id, disciplinaId, concluido });

test('coberturaEdital: geral e por disciplina', () => {
  const topicos = [T('1', 'a', true), T('2', 'a', false), T('3', 'b', true)];
  const r = coberturaEdital(topicos);
  expect(r.geral).toBeCloseTo(2 / 3);
  expect(r.porDisciplina.get('a')).toBeCloseTo(0.5);
  expect(r.porDisciplina.get('b')).toBe(1);
});

test('coberturaEdital: sem tópicos retorna 0', () => {
  expect(coberturaEdital([]).geral).toBe(0);
});

test('coberturaPonderada: disciplina de peso maior domina', () => {
  const disciplinas = [D('a', 5), D('b', 1)];
  const topicos = [T('1', 'a', true), T('2', 'a', true), T('3', 'b', false), T('4', 'b', false)];
  // (5*1 + 1*0) / (5+1) = 0.8333
  expect(coberturaPonderada(disciplinas, topicos)).toBeCloseTo(5 / 6);
});

test('coberturaPonderada: disciplina sem tópicos é ignorada', () => {
  const disciplinas = [D('a', 5), D('vazia', 5)];
  const topicos = [T('1', 'a', true)];
  expect(coberturaPonderada(disciplinas, topicos)).toBe(1);
});

test('coberturaPonderada: peso inválido cai para 3', () => {
  const disciplinas = [D('a', 99), D('b', 3)];
  const topicos = [T('1', 'a', true), T('2', 'b', false)];
  expect(coberturaPonderada(disciplinas, topicos)).toBeCloseTo(0.5);
});

test('aproveitamento: geral e por disciplina', () => {
  const topicos = [T('t1', 'a', true), T('t2', 'b', true)];
  const sessoes: SessaoExercicioLite[] = [
    { topicoId: 't1', acertos: 8, erros: 2, data: '2026-09-01' },
    { topicoId: 't1', acertos: 5, erros: 5, data: '2026-09-02' },
    { topicoId: 't2', acertos: 3, erros: 1, data: '2026-09-02' },
  ];
  const r = aproveitamento(sessoes, topicos);
  expect(r.geral).toBeCloseTo((8 + 5 + 3) / (10 + 10 + 4));
  expect(r.porDisciplina.get('a')).toBeCloseTo(13 / 20);
  expect(r.porDisciplina.get('b')).toBeCloseTo(3 / 4);
});

test('aproveitamento: sem questões retorna null', () => {
  const r = aproveitamento([], [T('t1', 'a', false)]);
  expect(r.geral).toBeNull();
  expect(r.porDisciplina.get('a')).toBeNull();
});

test('tempoEstudado: total, por disciplina e últimos 7 dias', () => {
  const agora = new Date('2026-09-10T12:00:00Z');
  const topicos = [T('t1', 'a', true), T('t2', 'b', true)];
  const sessoes: SessaoEstudoLite[] = [
    { topicoId: 't1', duracaoSegundos: 3600, iniciadaEm: '2026-09-09T10:00:00Z' },
    { topicoId: 't2', duracaoSegundos: 1800, iniciadaEm: '2026-09-01T10:00:00Z' },
  ];
  const r = tempoEstudado(sessoes, topicos, agora);
  expect(r.totalSegundos).toBe(5400);
  expect(r.porDisciplina.get('a')).toBe(3600);
  expect(r.ultimos7diasSegundos).toBe(3600);
});
