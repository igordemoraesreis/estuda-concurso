import { Pressable, ScrollView, Text, View } from 'react-native';
import { Input } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import type { Arvore } from './schema';

export function ArvoreEditor({ value, onChange }: { value: Arvore; onChange: (a: Arvore) => void }) {
  const { c } = useTheme();
  const set = (fn: (draft: Arvore) => void) => {
    const next: Arvore = JSON.parse(JSON.stringify(value));
    fn(next);
    onChange(next);
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 4 }}>
      {value.disciplinas.map((d, di) => (
        <View
          key={di}
          style={{ borderColor: c('border'), borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }}
        >
          <Input
            label="Disciplina"
            value={d.nome}
            onChangeText={(t) =>
              set((x) => {
                x.disciplinas[di].nome = t;
              })
            }
          />
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: c('muted') }}>Peso</Text>
            {[1, 2, 3, 4, 5].map((p) => (
              <Pressable
                key={p}
                accessibilityLabel={`Peso ${p} para ${d.nome}`}
                onPress={() =>
                  set((x) => {
                    x.disciplinas[di].peso = p;
                  })
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: d.peso === p ? c('primary') : c('surface'),
                }}
              >
                <Text style={{ color: d.peso === p ? '#FFF' : c('text') }}>{p}</Text>
              </Pressable>
            ))}
          </View>

          {d.topicos.map((t, ti) => (
            <View key={ti} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tópico"
                  value={t.nome}
                  onChangeText={(v) =>
                    set((x) => {
                      x.disciplinas[di].topicos[ti].nome = v;
                    })
                  }
                />
              </View>
              <Pressable
                accessibilityLabel={`Remover tópico ${t.nome}`}
                onPress={() =>
                  set((x) => {
                    x.disciplinas[di].topicos.splice(ti, 1);
                  })
                }
              >
                <Text style={{ color: c('danger') }}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityLabel={`Adicionar tópico em ${d.nome}`}
            onPress={() =>
              set((x) => {
                x.disciplinas[di].topicos.push({ nome: 'Novo tópico' });
              })
            }
          >
            <Text style={{ color: c('primary') }}>+ tópico</Text>
          </Pressable>

          {d.assuntos.map((a, ai) => (
            <View
              key={ai}
              style={{
                marginLeft: 12,
                gap: 6,
                borderLeftColor: c('border'),
                borderLeftWidth: 2,
                paddingLeft: 8,
              }}
            >
              <Input
                label="Assunto"
                value={a.nome}
                onChangeText={(v) =>
                  set((x) => {
                    x.disciplinas[di].assuntos[ai].nome = v;
                  })
                }
              />
              {a.topicos.map((t, ti) => (
                <View key={ti} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Tópico"
                      value={t.nome}
                      onChangeText={(v) =>
                        set((x) => {
                          x.disciplinas[di].assuntos[ai].topicos[ti].nome = v;
                        })
                      }
                    />
                  </View>
                  <Pressable
                    accessibilityLabel={`Remover tópico ${t.nome}`}
                    onPress={() =>
                      set((x) => {
                        x.disciplinas[di].assuntos[ai].topicos.splice(ti, 1);
                      })
                    }
                  >
                    <Text style={{ color: c('danger') }}>✕</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                accessibilityLabel={`Adicionar tópico em ${a.nome}`}
                onPress={() =>
                  set((x) => {
                    x.disciplinas[di].assuntos[ai].topicos.push({ nome: 'Novo tópico' });
                  })
                }
              >
                <Text style={{ color: c('primary') }}>+ tópico</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Remover assunto ${a.nome}`}
                onPress={() =>
                  set((x) => {
                    x.disciplinas[di].assuntos.splice(ai, 1);
                  })
                }
              >
                <Text style={{ color: c('danger') }}>Remover assunto</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityLabel={`Adicionar assunto em ${d.nome}`}
            onPress={() =>
              set((x) => {
                x.disciplinas[di].assuntos.push({ nome: 'Novo assunto', topicos: [] });
              })
            }
          >
            <Text style={{ color: c('primary') }}>+ assunto</Text>
          </Pressable>

          <Pressable
            accessibilityLabel={`Remover disciplina ${d.nome}`}
            onPress={() =>
              set((x) => {
                x.disciplinas.splice(di, 1);
              })
            }
          >
            <Text style={{ color: c('danger') }}>Remover disciplina</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        accessibilityLabel="Adicionar disciplina"
        onPress={() =>
          set((x) => {
            x.disciplinas.push({ nome: 'Nova disciplina', peso: 3, assuntos: [], topicos: [] });
          })
        }
      >
        <Text style={{ color: c('primary') }}>+ disciplina</Text>
      </Pressable>
    </ScrollView>
  );
}
