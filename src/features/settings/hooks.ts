import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/query';
import { normalizeError } from '@/lib/errors';

export type Settings = { tema: 'light' | 'dark' | 'system'; limiaresRevisaoDias: number[] };
const DEFAULTS: Settings = { tema: 'system', limiaresRevisaoDias: [7, 15, 30] };

export type Profile = {
  id: string;
  display_name: string | null;
  active_concurso_id: string | null;
  settings: Settings;
};

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: qk.profile(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, active_concurso_id, settings')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw normalizeError(error);
      if (!data) return null;
      return { ...data, settings: { ...DEFAULTS, ...(data.settings as Partial<Settings>) } };
    },
  });
}

export function useUpdateSettings(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const atual = qc.getQueryData<Profile>(qk.profile(userId));
      const merged = { ...DEFAULTS, ...atual?.settings, ...patch };
      const { error } = await supabase.from('profiles').update({ settings: merged }).eq('id', userId!);
      if (error) throw normalizeError(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile(userId) }),
  });
}
