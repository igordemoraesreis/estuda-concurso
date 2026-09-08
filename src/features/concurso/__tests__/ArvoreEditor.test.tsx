import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import type { Arvore } from '../schema';
import { ArvoreEditor } from '../ArvoreEditor';

const base: Arvore = {
  disciplinas: [{ nome: 'Português', peso: 3, assuntos: [], topicos: [{ nome: 'Crase' }] }],
};

test('altera o peso da disciplina', async () => {
  const onChange = jest.fn();
  await render(
    <ThemeProvider>
      <ArvoreEditor value={base} onChange={onChange} />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByLabelText('Peso 5 para Português'));
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinas: [expect.objectContaining({ peso: 5 })] }),
    ),
  );
});

test('remove um tópico', async () => {
  const onChange = jest.fn();
  await render(
    <ThemeProvider>
      <ArvoreEditor value={base} onChange={onChange} />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByLabelText('Remover tópico Crase'));
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinas: [expect.objectContaining({ topicos: [] })] }),
    ),
  );
});

test('adiciona uma disciplina', async () => {
  const onChange = jest.fn();
  await render(
    <ThemeProvider>
      <ArvoreEditor value={{ disciplinas: [] }} onChange={onChange} />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByLabelText('Adicionar disciplina'));
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinas: [expect.objectContaining({ nome: 'Nova disciplina', peso: 3 })] }),
    ),
  );
});
