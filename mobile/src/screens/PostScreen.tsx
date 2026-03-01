import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

type Booking = { id: string; title: string | null; bookingType: string; status: string };

export default function PostScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const list = await api<Booking[]>('/bookings/customer/me');
      setBookings(Array.isArray(list) ? list.filter((b) => b.status === 'confirmed') : []);
    } catch {
      setBookings([]);
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
      <Text style={styles.title}>Share your trip</Text>
      <Text style={styles.subtitle}>Write a review for a past booking</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : bookings.length === 0 ? (
        <Text style={styles.muted}>No completed bookings to review yet.</Text>
      ) : (
        bookings.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={styles.card}
            onPress={() => navigation.getParent()?.navigate('WriteReview', { bookingId: b.id, title: b.title ?? b.bookingType })}
          >
            <Text style={styles.cardTitle}>{b.title ?? b.bookingType}</Text>
            <Text style={styles.cardMeta}>Write review</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { color: '#64748b', marginBottom: 20 },
  muted: { color: '#64748b' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontWeight: '600', color: '#0f172a' },
  cardMeta: { color: '#2F7DFF', fontSize: 14, marginTop: 4 },
});
