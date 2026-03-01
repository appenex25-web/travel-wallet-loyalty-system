import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../api';

type Offer = { id: string; name: string; description: string | null; type: string };

export default function RewardsScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Offer[]>('/points/offers/active')
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rewards & offers</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : offers.length === 0 ? (
        <Text style={styles.muted}>No active offers</Text>
      ) : (
        offers.map((o) => (
          <View key={o.id} style={styles.card}>
            <Text style={styles.name}>{o.name}</Text>
            {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
            <Text style={styles.type}>{o.type}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20 },
  title: { color: '#d4af37', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  muted: { color: '#64748b' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  name: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
  desc: { color: '#94a3b8', marginTop: 4 },
  type: { color: '#d4af37', fontSize: 12, marginTop: 4 },
});
