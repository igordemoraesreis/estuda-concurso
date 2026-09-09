import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/types/db';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore tem limite ~2KB por chave; usa AsyncStorage como fallback no nativo.
const storage =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k).catch(() => AsyncStorage.getItem(k)),
        setItem: (k: string, v: string) =>
          SecureStore.setItemAsync(k, v).catch(() => AsyncStorage.setItem(k, v)),
        removeItem: (k: string) =>
          SecureStore.deleteItemAsync(k).catch(() => AsyncStorage.removeItem(k)),
      };

export const supabase = createClient<Database>(url, anon, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // No web, o retorno do OAuth vem como parâmetros na URL; no nativo o fluxo é via deep link.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
