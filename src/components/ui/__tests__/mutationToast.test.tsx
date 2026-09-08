import { Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { queryClient } from '@/lib/query';
import { ToastProvider } from '../Toast';

// Sem o clear, os timers de garbage collection do query-core seguram o worker do Jest.
afterEach(() => queryClient.clear());

function Falha({ aoMontar }: { aoMontar: (disparar: () => void) => void }) {
  const m = useMutation({ mutationFn: async () => Promise.reject(new Error('boom')) });
  aoMontar(() => m.mutate());
  return <Text>tela</Text>;
}

test('mutation rejeitada dispara toast de erro sem onError próprio', async () => {
  let disparar = () => {};
  await render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <Falha aoMontar={(d) => (disparar = d)} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

  disparar();

  await waitFor(() =>
    expect(screen.getByText('Algo deu errado. Tente novamente.')).toBeOnTheScreen(),
  );
});
