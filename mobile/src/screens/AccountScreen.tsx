import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

type Customer = { id: string; name: string; phone: string | null; tier: string };

export default function AccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [saved, setSaved] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [c, pinRes, s] = await Promise.all([
        api<Customer>('/customers/me'),
        api<{ hasPin: boolean }>('/customers/me/has-pin').catch(() => ({ hasPin: false })),
        api<{ id: string; title: string }[]>('/campaigns/saved/me').catch(() => []),
      ]);
      setCustomer(c);
      setHasPin(pinRes?.hasPin ?? false);
      setSaved(Array.isArray(s) ? s : []);
    } catch {
      setCustomer(null);
      setHasPin(false);
      setSaved([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2F7DFF" />}
    >
      <Text style={styles.title}>Account</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : customer ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Tier</Text>
            <Text style={styles.cardValue}>{customer.tier}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Details</Text>
            <Text style={styles.cardValue}>{customer.name}</Text>
            <Text style={styles.cardMeta}>{customer.phone ?? 'No phone'}</Text>
          </View>
          <TouchableOpacity style={styles.link} onPress={() => navigation.getParent()?.navigate('ChangePassword')}>
            <Text style={styles.linkText}>Change password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={() => navigation.getParent()?.navigate('TransactionPin' as never, { hasPin } as never)}
          >
            <Text style={styles.linkText}>
              {hasPin ? 'Change transaction PIN' : 'Create transaction PIN'}
            </Text>
          </TouchableOpacity>
          {saved.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Saved campaigns</Text>
              {saved.map((c) => (
                <View key={c.id} style={styles.card}>
                  <Text style={styles.cardValue}>{c.title}</Text>
                </View>
              ))}
            </>
          )}
        </>
      ) : (
        <Text style={styles.muted}>Could not load account.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  muted: { color: '#64748b' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  cardValue: { fontWeight: '600', color: '#0f172a' },
  cardMeta: { color: '#64748b', fontSize: 14, marginTop: 4 },
  link: { marginTop: 16 },
  linkText: { color: '#2F7DFF', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 24, marginBottom: 12 },
});
