import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api, resolveImageUrl } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 200;

type RoomType = {
  name: string;
  description?: string;
  size?: string;
  amenities?: string[];
  pricePerNight?: number;
  priceDelta?: number;
  imageUrls?: string[];
};

type Hotel = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  imageUrls?: string[] | null;
  roomTypes?: RoomType[] | null;
  pricePerNight: number | null;
  currency: string;
};

function getPricePerNight(hotel: Hotel, roomType: RoomType | null): number {
  if (roomType != null) {
    if (roomType.pricePerNight != null) return Number(roomType.pricePerNight);
    return (hotel.pricePerNight != null ? Number(hotel.pricePerNight) : 0) + Number(roomType.priceDelta ?? 0);
  }
  return hotel.pricePerNight != null ? Number(hotel.pricePerNight) : 0;
}

function parseDate(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return null;
  const d = new Date(s.trim());
  return isNaN(d.getTime()) ? null : d;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const from = parseDate(checkIn);
  const to = parseDate(checkOut);
  if (!from || !to || to <= from) return 0;
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export default function HotelDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const hotelId = (route.params as { hotelId?: string })?.hotelId;
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pay_now_wallet' | 'pay_later' | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [pin, setPin] = useState('');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    if (!hotelId) return;
    api<Hotel>(`/hotels/${hotelId}`)
      .then(setHotel)
      .catch(() => setHotel(null))
      .finally(() => setLoading(false));
  }, [hotelId]);

  async function handleBook() {
    if (!hotel || !paymentMethod) return;
    if (paymentMethod === 'pay_now_wallet' && !/^\d{6}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Enter your 6-digit security PIN.');
      return;
    }
    setBooking(true);
    try {
      const body: Record<string, unknown> = {
        hotelId: hotel.id,
        paymentMethod,
        numberOfPeople: Math.max(1, Math.min(20, numberOfPeople)),
      };
      if (paymentMethod === 'pay_now_wallet') body.pin = pin.trim();
      if (checkIn.trim()) body.checkInAt = checkIn.trim();
      if (checkOut.trim()) body.checkOutAt = checkOut.trim();
      const roomTypes = hotel.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes : [];
      const selectedRoom = roomTypes[selectedRoomIndex];
      if (selectedRoom) body.roomType = selectedRoom.name;
      await api('/bookings/from-catalog', {
        method: 'POST',
        body: JSON.stringify(body),
      });
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

  if (loading || !hotel) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const roomTypes = hotel.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes : [];
  const selectedRoom = roomTypes[selectedRoomIndex] ?? null;
  const pricePerNight = getPricePerNight(hotel, selectedRoom);
  const nights = nightsBetween(checkIn, checkOut);
  const totalAmount = nights > 0 ? nights * pricePerNight : pricePerNight;
  const images = (hotel.imageUrls && hotel.imageUrls.length > 0) ? hotel.imageUrls : (hotel.imageUrl ? [hotel.imageUrl] : []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageWrap}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
          >
            {images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri: resolveImageUrl(uri) }}
                style={styles.detailImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.detailImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>🏨</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{hotel.name}</Text>
      {hotel.location ? <Text style={styles.location}>📍 {hotel.location}</Text> : null}
      {hotel.description ? <Text style={styles.body}>{hotel.description}</Text> : null}

      {roomTypes.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Room types</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
            {roomTypes.map((r, i) => (
              <TouchableOpacity
                key={r.name}
                style={[styles.tab, selectedRoomIndex === i && styles.tabSelected]}
                onPress={() => setSelectedRoomIndex(i)}
              >
                <Text style={[styles.tabText, selectedRoomIndex === i && styles.tabTextSelected]} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.tabPrice}>
                  {hotel.currency} {(r.pricePerNight ?? (Number(hotel.pricePerNight) + Number(r.priceDelta ?? 0))).toFixed(0)}/night
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedRoom && (
            <View style={styles.roomCard}>
              {selectedRoom.description ? <Text style={styles.roomDesc}>{selectedRoom.description}</Text> : null}
              {selectedRoom.size ? <Text style={styles.roomSize}>Size: {selectedRoom.size}</Text> : null}
              {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                <View style={styles.amenitiesWrap}>
                  <Text style={styles.amenitiesLabel}>Amenities</Text>
                  {selectedRoom.amenities.map((a, i) => (
                    <Text key={i} style={styles.amenity}>• {a}</Text>
                  ))}
                </View>
              )}
              {(selectedRoom.imageUrls && selectedRoom.imageUrls.length > 0) && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomImagesScroll}>
                  {selectedRoom.imageUrls.map((uri, i) => (
                    <Image key={i} source={{ uri: resolveImageUrl(uri) }} style={styles.roomThumb} resizeMode="cover" />
                  ))}
                </ScrollView>
              )}
              <Text style={styles.roomPrice}>
                {hotel.currency} {pricePerNight.toFixed(2)} per night
              </Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.price}>
          {hotel.currency} {pricePerNight.toFixed(2)} per night
        </Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Check-in</Text>
        <TextInput
          style={styles.input}
          value={checkIn}
          onChangeText={setCheckIn}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Check-out</Text>
        <TextInput
          style={styles.input}
          value={checkOut}
          onChangeText={setCheckOut}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
        />
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>
          {hotel.currency} {totalAmount.toFixed(2)}
          {nights > 0 ? ` (${nights} night${nights > 1 ? 's' : ''} × ${pricePerNight.toFixed(2)})` : ' (1 night)'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => setShowBookModal(true)}
        disabled={booking}
      >
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
                  <Text style={styles.payOptionDesc}>Deduct from your wallet. You will enter your PIN next.</Text>
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
            {paymentMethod && (
              <TouchableOpacity style={styles.modalCancelOnly} onPress={closeBookModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 24 },
  muted: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  imageWrap: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#e2e8f0' },
  imageScroll: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
  imageScrollContent: {},
  detailImage: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
  section: { marginBottom: 16, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, color: '#64748b', marginBottom: 6, paddingHorizontal: 20, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', marginHorizontal: 20 },
  tabScroll: { marginBottom: 12, maxHeight: 72 },
  tabRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingRight: 40 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    minWidth: 120,
  },
  tabSelected: { borderColor: '#2F7DFF', backgroundColor: 'rgba(47, 125, 255, 0.1)' },
  tabText: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  tabTextSelected: { color: '#2F7DFF' },
  tabPrice: { color: '#64748b', fontSize: 11, marginTop: 2 },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.15)',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  roomDesc: { color: '#0f172a', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  roomSize: { color: '#64748b', fontSize: 13, marginBottom: 8 },
  amenitiesWrap: { marginBottom: 8 },
  amenitiesLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  amenity: { color: '#0f172a', fontSize: 13, marginLeft: 4 },
  roomImagesScroll: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  roomThumb: { width: 80, height: 80, borderRadius: 8 },
  roomPrice: { fontWeight: '700', color: '#2F7DFF', fontSize: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  totalLabel: { fontWeight: '600', color: '#0f172a' },
  total: { fontWeight: '700', color: '#0f172a', fontSize: 16 },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8, paddingHorizontal: 20, paddingTop: 16 },
  location: { color: '#64748b', marginBottom: 8, paddingHorizontal: 20 },
  body: { color: '#0f172a', marginBottom: 16, paddingHorizontal: 20, lineHeight: 22 },
  price: { fontWeight: '600', color: '#2F7DFF', marginBottom: 16, paddingHorizontal: 20 },
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
