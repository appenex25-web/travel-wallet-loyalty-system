import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { api } from '../api';

type LedgerEntry = { id: string; amount: number; currency: string; source?: string; reference?: string; createdAt: string };

export default function WalletScreen() {
  const [balance, setBalance] = useState<{ balance: number; currency: string } | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [bal, pts, hist] = await Promise.all([
        api<{ balance: number; currency: string }>('/wallet/me'),
        api<number>('/points/me'),
        api<LedgerEntry[]>('/wallet/me/history').catch(() => []),
      ]);
      setBalance(bal);
      setPoints(pts);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch {
      setBalance(null);
      setPoints(null);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2F7DFF" />
      }
    >
      <View style={styles.card}>
        <Text style={styles.label}>Wallet balance</Text>
        <Text style={styles.value}>
          {balance ? `${balance.currency} ${Number(balance.balance).toFixed(2)}` : '—'}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Points</Text>
        <Text style={styles.value}>{points !== null ? points : '—'}</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {history.length === 0 ? (
        <Text style={styles.muted}>No transactions yet.</Text>
      ) : (
        history.slice(0, 20).map((h) => (
          <View key={h.id} style={styles.row}>
            <Text style={styles.rowAmount}>{Number(h.amount) >= 0 ? '+' : ''}{h.currency} {Number(h.amount).toFixed(2)}</Text>
            <Text style={styles.rowMeta}>{h.source ?? ''} · {new Date(h.createdAt).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  loading: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.15)',
    shadowColor: '#2F7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  label: { color: '#64748b', fontSize: 14, marginBottom: 4 },
  value: { color: '#2F7DFF', fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { color: '#0f172a', fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 12 },
  muted: { color: '#94a3b8', marginBottom: 16 },
  row: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  rowAmount: { color: '#0f172a', fontWeight: '600' },
  rowMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
