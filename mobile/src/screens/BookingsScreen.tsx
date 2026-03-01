import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

const BOOKING_TYPE_LABELS: Record<string, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  trip_package: 'Trip package',
  pending_confirmation: 'Waiting confirmation',
  quote: 'Quote',
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  denied: 'Denied',
  other: 'Booking',
};

type Booking = {
  id: string;
  bookingType?: string;
  title?: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  walletApplied: number;
  createdAt: string;
};

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [payPin, setPayPin] = useState('');

  async function load() {
    try {
      const list = await api<Booking[]>('/bookings/customer/me');
      setBookings(list);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openPayModal(booking: Booking) {
    const remaining = Number(booking.totalAmount) - Number(booking.walletApplied);
    if (remaining <= 0) {
      Alert.alert('Done', 'This booking is already fully paid from wallet.');
      return;
    }
    setPayingBooking(booking);
    setPayPin('');
  }

  async function confirmPayWithWallet() {
    if (!payingBooking || !/^\d{6}$/.test(payPin)) {
      Alert.alert('Invalid PIN', 'Enter your 6-digit security PIN.');
      return;
    }
    const remaining = Number(payingBooking.totalAmount) - Number(payingBooking.walletApplied);
    let balance: number;
    try {
      const res = await api<{ balance: number }>('/wallet/me');
      balance = Number(res.balance);
    } catch {
      Alert.alert('Error', 'Could not load wallet balance.');
      return;
    }
    const amountToApply = Math.min(remaining, balance);
    if (amountToApply <= 0) {
      Alert.alert('Insufficient balance', 'Top up your wallet to pay for this booking.');
      setPayingBooking(null);
      return;
    }
    setApplyingId(payingBooking.id);
    try {
      await api(`/bookings/${payingBooking.id}/apply-wallet`, {
        method: 'POST',
        body: JSON.stringify({ amount: amountToApply, pin: payPin }),
      });
      setPayingBooking(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setApplyingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F7DFF" />
        <Text style={styles.muted}>Loading bookings…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
      <Text style={styles.title}>My trips & bookings</Text>
      {bookings.length === 0 ? (
        <Text style={styles.muted}>No bookings yet</Text>
      ) : (
        bookings.map((b) => {
          const remaining = Number(b.totalAmount) - Number(b.walletApplied);
          const canPay = (b.status === 'quote' || b.status === 'pending_payment') && remaining > 0;
          const typeLabel = BOOKING_TYPE_LABELS[b.bookingType || ''] || 'Booking';
          const statusLabel = BOOKING_TYPE_LABELS[b.status] || b.status;
          const subtitle = b.title ? `${typeLabel} · ${b.title}` : typeLabel;
          return (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardTitle}>{subtitle}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.value}>{b.currency} {Number(b.totalAmount).toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Wallet applied</Text>
                <Text style={styles.value}>{b.currency} {Number(b.walletApplied).toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <Text style={[styles.value, styles.status]}>{b.status === 'pending_confirmation' ? 'Waiting confirmation' : statusLabel}</Text>
              </View>
              <Text style={styles.date}>{new Date(b.createdAt).toLocaleDateString()}</Text>
              {canPay && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => openPayModal(b)}
                  disabled={applyingId === b.id}
                >
                  {applyingId === b.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Pay with wallet</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Modal visible={!!payingBooking} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter 6-digit PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={payPin}
              onChangeText={setPayPin}
              placeholder="••••••"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPayingBooking(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmPayWithWallet}>
                <Text style={styles.modalConfirmText}>Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  center: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  muted: { color: '#64748b' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { color: '#2F7DFF', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#64748b', fontSize: 14 },
  value: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  status: { textTransform: 'capitalize' },
  date: { color: '#64748b', fontSize: 12, marginTop: 8 },
  button: {
    marginTop: 12,
    backgroundColor: '#2F7DFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  pinInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 18, color: '#0f172a' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center' },
  modalCancelText: { color: '#0f172a', fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2F7DFF', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
});
