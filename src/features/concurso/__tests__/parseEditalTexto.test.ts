import { parseEditalTexto } from '../parseEditalTexto';

test('numeração hierárquica: 1 = disciplina, 1.1 = tópico', () => {
  const r = parseEditalTexto('1 PORTUGUÊS\n1.1 Ortografia\n1.2 Crase\n2 RLM\n2.1 Proposições');
  expect(r.disciplinas.map((d) => d.nome)).toEqual(['PORTUGUÊS', 'RLM']);
  expect(r.disciplinas[0].topicos.map((t) => t.nome)).toEqual(['Ortografia', 'Crase']);
  expect(r.disciplinas[0].peso).toBe(3);
});

test('três níveis: 1.1 vira assunto, 1.1.1 vira tópico do assunto', () => {
  const r = parseEditalTexto('1 DIREITO\n1.1 Constitucional\n1.1.1 Princípios\n1.1.2 Direitos fundamentais');
  expect(r.disciplinas[0].assuntos[0].nome).toBe('Constitucional');
  expect(r.disciplinas[0].assuntos[0].topicos.map((t) => t.nome)).toEqual(['Princípios', 'Direitos fundamentais']);
  expect(r.disciplinas[0].topicos).toEqual([]);
});

test('linhas em MAIÚSCULAS sem numeração viram disciplina; marcadores viram tópicos', () => {
  const r = parseEditalTexto('PORTUGUÊS\n- Ortografia\n- Acentuação\nMATEMÁTICA\n- Frações');
  expect(r.disciplinas.map((d) => d.nome)).toEqual(['PORTUGUÊS', 'MATEMÁTICA']);
  expect(r.disciplinas[0].topicos.map((t) => t.nome)).toEqual(['Ortografia', 'Acentuação']);
});

test('linhas vazias e espaços são ignorados', () => {
  const r = parseEditalTexto('\n  1 PORTUGUÊS  \n\n  1.1 Ortografia \n');
  expect(r.disciplinas).toHaveLength(1);
  expect(r.disciplinas[0].topicos[0].nome).toBe('Ortografia');
});

test('tópicos antes de qualquer disciplina são descartados', () => {
  const r = parseEditalTexto('- solto\n1 PORTUGUÊS\n1.1 Ortografia');
  expect(r.disciplinas).toHaveLength(1);
  expect(r.disciplinas[0].topicos.map((t) => t.nome)).toEqual(['Ortografia']);
});

test('texto vazio retorna lista vazia', () => {
  expect(parseEditalTexto('')).toEqual({ disciplinas: [] });
});
