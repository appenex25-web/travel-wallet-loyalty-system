import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const CARD_HEIGHT = 100;

type Flight = { id: string; origin: string; destination: string; flightNumber: string | null; departureAt: string | null; price: number; currency: string };

export default function FlightsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const list = await api<Flight[]>('/flights').catch(() => []);
      setFlights(Array.isArray(list) ? list : []);
    } catch {
      setFlights([]);
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
      contentContainerStyle={[styles.content, { paddingTop: Math.min(insets.top, 12) + 8 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2F7DFF" />}
    >
      <Text style={styles.title}>Flights</Text>
      {loading && !refreshing ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : flights.length === 0 ? (
        <Text style={styles.muted}>No flights yet.</Text>
      ) : (
        <View style={styles.grid}>
          {flights.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.card}
              onPress={() => navigation.getParent()?.navigate('FlightDetail', { flightId: f.id })}
              activeOpacity={0.9}
            >
              <Text style={styles.cardRoute}>✈️ {f.origin} → {f.destination}</Text>
              {f.flightNumber ? <Text style={styles.cardFlightNo}>{f.flightNumber}</Text> : null}
              <Text style={styles.cardPrice}>{f.currency} {Number(f.price).toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: H_PAD, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  muted: { color: '#64748b', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GAP / 2, gap: GAP },
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.15)',
  },
  cardRoute: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  cardFlightNo: { color: '#64748b', fontSize: 12, marginTop: 4 },
  cardPrice: { color: '#2F7DFF', fontWeight: '700', fontSize: 14, marginTop: 8 },
});
