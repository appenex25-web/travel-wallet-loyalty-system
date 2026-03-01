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
  const [showBookModal, setShowBookModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pay_now_wallet' | 'pay_later' | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!flightId) return;
    api<Flight>(`/flights/${flightId}`)
      .then(setFlight)
      .catch(() => setFlight(null))
      .finally(() => setLoading(false));
  }, [flightId]);

  async function handleBook() {
    if (!flight || !paymentMethod) return;
    if (paymentMethod === 'pay_now_wallet' && !/^\d{6}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Enter your 6-digit security PIN.');
      return;
    }
    setBooking(true);
    try {
      const body: Record<string, unknown> = {
        flightId: flight.id,
        paymentMethod,
        numberOfPeople: Math.max(1, Math.min(20, numberOfPeople)),
      };
      if (paymentMethod === 'pay_now_wallet') body.pin = pin.trim();
      await api('/bookings/from-catalog', { method: 'POST', body: JSON.stringify(body) });
      setShowBookModal(false);
      setPaymentMethod(null);
      setNumberOfPeople(1);
      setPin('');
      Alert.alert('Booked', paymentMethod === 'pay_later' ? 'Reservation created. Pay in person within 48 hours. Check My Trips and Messages.' : 'Reservation created. Check My Trips and Messages for confirmation.');
      (navigation as any).goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  function closeBookModal() {
    setShowBookModal(false);
    setPaymentMethod(null);
    setNumberOfPeople(1);
    setPin('');
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
      <TouchableOpacity style={styles.bookButton} onPress={() => setShowBookModal(true)} disabled={booking}>
        <Text style={styles.bookButtonText}>Book</Text>
      </TouchableOpacity>

      <Modal visible={showBookModal} transparent animationType="fade" onRequestClose={closeBookModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeBookModal}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1} onPress={() => {}}>
            {!paymentMethod ? (
              <>
                <Text style={styles.modalTitle}>How do you want to pay?</Text>
                <TouchableOpacity style={styles.payOption} onPress={() => setPaymentMethod('pay_now_wallet')}>
                  <Text style={styles.payOptionTitle}>Pay now (use wallet)</Text>
                  <Text style={styles.payOptionDesc}>Deduct from wallet. You will enter PIN next.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.payOption} onPress={() => setPaymentMethod('pay_later')}>
                  <Text style={styles.payOptionTitle}>Pay later</Text>
                  <Text style={styles.payOptionDesc}>Pay in person within 48 hours.</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Number of people</Text>
                <View style={styles.peopleRow}>
                  <TouchableOpacity style={styles.stepper} onPress={() => setNumberOfPeople((n) => Math.max(1, n - 1))}>
                    <Text style={styles.stepperText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.peopleValue}>{numberOfPeople}</Text>
                  <TouchableOpacity style={styles.stepper} onPress={() => setNumberOfPeople((n) => Math.min(20, n + 1))}>
                    <Text style={styles.stepperText}>+</Text>
                  </TouchableOpacity>
                </View>
                {paymentMethod === 'pay_now_wallet' && (
                  <>
                    <Text style={styles.modalLabel}>Enter 6-digit PIN</Text>
                    <TextInput
                      style={styles.pinInput}
                      value={pin}
                      onChangeText={setPin}
                      placeholder="••••••"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={6}
                      secureTextEntry
                    />
                  </>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setPaymentMethod(null)}>
                    <Text style={styles.modalCancelText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalBook} onPress={handleBook} disabled={booking}>
                    <Text style={styles.bookButtonText}>{booking ? 'Booking…' : 'Book'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {paymentMethod ? (
              <TouchableOpacity style={styles.modalCancelOnly} onPress={closeBookModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
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
  payOption: { backgroundColor: 'rgba(47, 125, 255, 0.08)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(47, 125, 255, 0.2)' },
  payOptionTitle: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  payOptionDesc: { color: '#64748b', fontSize: 12, marginTop: 4 },
  peopleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 16 },
  stepper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  peopleValue: { fontSize: 18, fontWeight: '700', color: '#0f172a', minWidth: 24, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  modalCancelOnly: { marginTop: 12, alignSelf: 'center' },
});
