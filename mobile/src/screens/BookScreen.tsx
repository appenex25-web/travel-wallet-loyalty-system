import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../api';

type Hotel = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  pricePerNight: number | null;
  currency: string;
};

type Flight = {
  id: string;
  origin: string;
  destination: string;
  flightNumber: string | null;
  price: number;
  currency: string;
};

export default function BookScreen() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api<Hotel[]>('/hotels').then(setHotels).catch(() => setHotels([])),
      api<Flight[]>('/flights').then(setFlights).catch(() => setFlights([])),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function bookHotel(hotel: Hotel) {
    setBookingId(hotel.id);
    try {
      const b = await api<{ id: string }>('/bookings/from-catalog', {
        method: 'POST',
        body: JSON.stringify({ hotelId: hotel.id }),
      });
      Alert.alert('Booked', `Booking created for ${hotel.name}. Pay in Bookings tab.`, [{ text: 'OK' }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBookingId(null);
    }
  }

  async function bookFlight(flight: Flight) {
    setBookingId(flight.id);
    try {
      await api('/bookings/from-catalog', {
        method: 'POST',
        body: JSON.stringify({ flightId: flight.id }),
      });
      Alert.alert('Booked', `${flight.origin} → ${flight.destination} booking created. Pay in Bookings tab.`, [{ text: 'OK' }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBookingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      api<Hotel[]>('/hotels').then(setHotels).catch(() => setHotels([])),
      api<Flight[]>('/flights').then(setFlights).catch(() => setFlights([])),
    ]);
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />}
    >
      <Text style={styles.title}>Book a trip</Text>
      <Text style={styles.sectionLabel}>Hotels</Text>
      {hotels.length === 0 ? (
        <Text style={styles.muted}>No hotels available</Text>
      ) : (
        hotels.map((h) => (
          <View key={h.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{h.name}</Text>
              {h.pricePerNight != null && (
                <Text style={styles.price}>{h.currency} {Number(h.pricePerNight).toFixed(2)}/night</Text>
              )}
            </View>
            {h.location ? <Text style={styles.muted}>{h.location}</Text> : null}
            {h.description ? <Text style={styles.desc} numberOfLines={2}>{h.description}</Text> : null}
            <TouchableOpacity
              style={styles.button}
              onPress={() => bookHotel(h)}
              disabled={bookingId === h.id}
            >
              {bookingId === h.id ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.buttonText}>Book</Text>}
            </TouchableOpacity>
          </View>
        ))
      )}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Flights</Text>
      {flights.length === 0 ? (
        <Text style={styles.muted}>No flights available</Text>
      ) : (
        flights.map((f) => (
          <View key={f.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{f.origin} → {f.destination}</Text>
              <Text style={styles.price}>{f.currency} {Number(f.price).toFixed(2)}</Text>
            </View>
            {f.flightNumber ? <Text style={styles.muted}>Flight {f.flightNumber}</Text> : null}
            <TouchableOpacity
              style={styles.button}
              onPress={() => bookFlight(f)}
              disabled={bookingId === f.id}
            >
              {bookingId === f.id ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.buttonText}>Book</Text>}
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#d4af37', fontSize: 20, fontWeight: '600', marginBottom: 20 },
  sectionLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  muted: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  desc: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
  price: { color: '#d4af37', fontSize: 14, fontWeight: '600' },
  button: {
    marginTop: 12,
    backgroundColor: '#d4af37',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#0f172a', fontWeight: '600' },
});
