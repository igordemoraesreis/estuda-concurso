import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'timer:v1';

type Status = 'idle' | 'running' | 'paused';
type Persistido = {
  topicoId: string | null;
  topicoNome: string | null;
  iniciadaEm: number | null;
  acumulado: number;
  status: Status;
};

type TimerState = Persistido & {
  start: (topicoId: string, topicoNome: string) => void;
  pause: (agora?: Date) => void;
  resume: (agora?: Date) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
};

const inicial: Persistido = {
  topicoId: null,
  topicoNome: null,
  iniciadaEm: null,
  acumulado: 0,
  status: 'idle',
};

function persist(s: Persistido) {
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
}

export const useTimer = create<TimerState>((set, get) => ({
  ...inicial,
  start: (topicoId, topicoNome) => {
    const s: Persistido = {
      topicoId,
      topicoNome,
      iniciadaEm: Date.now(),
      acumulado: 0,
      status: 'running',
    };
    set(s);
    persist(s);
  },
  pause: (agora = new Date()) => {
    const { iniciadaEm, acumulado } = get();
    const extra = iniciadaEm ? Math.floor((agora.getTime() - iniciadaEm) / 1000) : 0;
    const s: Persistido = {
      ...pick(get()),
      iniciadaEm: null,
      acumulado: acumulado + extra,
      status: 'paused',
    };
    set(s);
    persist(s);
  },
  resume: (agora = new Date()) => {
    const s: Persistido = { ...pick(get()), iniciadaEm: agora.getTime(), status: 'running' };
    set(s);
    persist(s);
  },
  reset: () => {
    set(inicial);
    persist(inicial);
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw) as Persistido);
    } catch {
      // ignora storage indisponível
    }
  },
}));

function pick(s: TimerState): Persistido {
  return {
    topicoId: s.topicoId,
    topicoNome: s.topicoNome,
    iniciadaEm: s.iniciadaEm,
    acumulado: s.acumulado,
    status: s.status,
  };
}

export function segundosDecorridos(
  s: Pick<TimerState, 'iniciadaEm' | 'acumulado' | 'status'>,
  agora: Date = new Date(),
): number {
  if (s.status === 'running' && s.iniciadaEm) {
    return s.acumulado + Math.floor((agora.getTime() - s.iniciadaEm) / 1000);
  }
  return s.acumulado;
}
