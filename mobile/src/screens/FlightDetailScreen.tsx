import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../api';

type Flight = {
  id: string;
  origin: string;
  destination: string;
  flightNumber: string | null;
  departureAt: string | null;
  price: number;
  currency: string;
};

export default function FlightDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const flightId = (route.params as { flightId?: string })?.flightId;
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!flightId) return;
    api<Flight>(`/flights/${flightId}`)
      .then(setFlight)
      .catch(() => setFlight(null))
      .finally(() => setLoading(false));
  }, [flightId]);

  async function handleBook() {
    if (!flight) return;
    if (!/^\d{6}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Enter your 6-digit security PIN.');
      return;
    }
    setBooking(true);
    try {
      await api('/bookings/from-catalog', {
        method: 'POST',
        body: JSON.stringify({ flightId: flight.id, pin: pin.trim() }),
      });
      setShowPinModal(false);
      setPin('');
      Alert.alert('Booked', 'Reservation requested. Check My Trips for status.');
      (navigation as any).goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  if (loading || !flight) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const dep = flight.departureAt ? new Date(flight.departureAt).toLocaleString() : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.route}>✈️ {flight.origin} → {flight.destination}</Text>
        {flight.flightNumber ? <Text style={styles.flightNo}>{flight.flightNumber}</Text> : null}
        {dep ? <Text style={styles.dep}>Departs: {dep}</Text> : null}
      </View>
      <Text style={styles.price}>
        {flight.currency} {Number(flight.price).toFixed(2)}
      </Text>
      <TouchableOpacity style={styles.bookButton} onPress={() => setShowPinModal(true)} disabled={booking}>
        <Text style={styles.bookButtonText}>Booking</Text>
      </TouchableOpacity>

      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPinModal(false)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>Enter 6-digit security PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="••••••"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowPinModal(false); setPin(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBook} onPress={handleBook} disabled={booking}>
                <Text style={styles.bookButtonText}>{booking ? 'Booking…' : 'Book'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 24 },
  muted: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  headerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(47, 125, 255, 0.15)' },
  route: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  flightNo: { color: '#64748b', marginTop: 4 },
  dep: { color: '#64748b', marginTop: 4 },
  price: { fontWeight: '700', color: '#2F7DFF', fontSize: 18, marginBottom: 16 },
  bookButton: {
    alignSelf: 'center',
    backgroundColor: '#2F7DFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  bookButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  pinInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 18, color: '#0f172a' },
  modalButtons: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  modalCancelText: { color: '#64748b', fontWeight: '600' },
  modalBook: { backgroundColor: '#2F7DFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
});
