import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Toast = { id: number; msg: string; tipo: 'sucesso' | 'erro' };
const Ctx = createContext<{ sucesso: (m: string) => void; erro: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, tipo: Toast['tipo']) => {
    const id = ++seq.current;
    setItems((l) => [...l, { id, msg, tipo }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3000);
  }, []);
  const api = useMemo(
    () => ({
      sucesso: (m: string) => push(m, 'sucesso'),
      erro: (m: string) => push(m, 'erro'),
    }),
    [push],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <View
        style={{ position: 'absolute', bottom: 40, left: 16, right: 16, gap: 8 }}
        pointerEvents="none"
      >
        {items.map((t) => (
          <View
            key={t.id}
            style={{
              backgroundColor: t.tipo === 'erro' ? c('danger') : c('success'),
              padding: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF' }}>{t.msg}</Text>
          </View>
        ))}
      </View>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast fora de ToastProvider');
  return v;
}
