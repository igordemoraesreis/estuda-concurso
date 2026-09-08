import { useEffect, useRef } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { useSession } from '@/features/auth/useSession';
import { useProfile } from '@/features/settings/hooks';

/**
 * Reaplica o tema salvo em `profile.settings.tema` ao `ThemeProvider` quando o
 * profile carrega. Sem isto, o `setOverride` da tela de Ajustes só dura a sessão
 * atual e o tema volta a "system" no restart do app.
 *
 * Não renderiza nada. Precisa estar dentro de `ThemeProvider` e ter acesso a
 * `useSession`/`useProfile`.
 */
export function ThemeRehydrator() {
  const { setOverride } = useTheme();
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id ?? null);
  const aplicadoRef = useRef<string | null>(null);

  const tema = profile?.settings.tema;

  useEffect(() => {
    if (!tema || aplicadoRef.current === tema) return;
    aplicadoRef.current = tema;
    setOverride(tema);
  }, [tema, setOverride]);

  return null;
}
