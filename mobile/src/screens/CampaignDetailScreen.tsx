import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api, resolveImageUrl } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 220;

type AddOn = { id: string; name: string; priceDelta: number };
type Campaign = {
  id: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  basePrice: number;
  currency: string;
  imageUrls: string[] | null;
  addOns?: AddOn[];
};

export default function CampaignDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const campaignId = (route.params as { campaignId?: string })?.campaignId;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!campaignId) return;
    api<Campaign>(`/campaigns/${campaignId}`)
      .then(setCampaign)
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const total = campaign
    ? Number(campaign.basePrice) +
      (campaign.addOns ?? [])
        .filter((a) => selectedAddOns.includes(a.id))
        .reduce((s, a) => s + Number(a.priceDelta), 0)
    : 0;

  const images = campaign?.imageUrls?.length ? campaign.imageUrls : [];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setSlideIndex(Math.min(Math.max(0, index), images.length - 1));
  };

  async function handleBookWithPin() {
    if (!campaign) return;
    if (!/^\d{6}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Enter your 6-digit security PIN.');
      return;
    }
    setBooking(true);
    try {
      await api('/bookings/from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: campaign.id,
          addOnIds: selectedAddOns,
          pin: pin.trim(),
        }),
      });
      setShowPinModal(false);
      setPin('');
      Alert.alert('Booked', 'Booking created. Check My Trips.');
      (navigation as any).goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  if (loading || !campaign) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image slideshow */}
      <View style={styles.imageWrap}>
        {images.length > 0 ? (
          <>
            <ScrollView
              ref={scrollRef as any}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
              style={styles.imageScroll}
            >
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri: resolveImageUrl(uri) }}
                  style={[styles.detailImage, { width: SCREEN_WIDTH }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.slideIndicator}>
                <Text style={styles.slideIndicatorText}>
                  {slideIndex + 1}/{images.length}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.detailImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{campaign.title}</Text>
      {campaign.shortDescription ? (
        <Text style={styles.desc}>{campaign.shortDescription}</Text>
      ) : null}
      {campaign.description ? (
        <Text style={styles.body}>{campaign.description}</Text>
      ) : null}
      <Text style={styles.price}>
        Base: {campaign.currency} {Number(campaign.basePrice).toFixed(2)}
      </Text>
      {(campaign.addOns ?? []).length > 0 && (
        <View style={styles.addOns}>
          <Text style={styles.addOnsTitle}>Add-ons</Text>
          {(campaign.addOns ?? []).map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[
                styles.addOnRow,
                selectedAddOns.includes(a.id) && styles.addOnSelected,
              ]}
              onPress={() =>
                setSelectedAddOns((prev) =>
                  prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                )
              }
            >
              <Text style={styles.addOnName}>{a.name}</Text>
              <Text style={styles.addOnDelta}>
                {Number(a.priceDelta) >= 0 ? '+' : ''}
                {a.priceDelta}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.total}>
        Total: {campaign.currency} {total.toFixed(2)}
      </Text>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => setShowPinModal(true)}
        disabled={booking}
      >
        <Text style={styles.bookButtonText}>Booking</Text>
      </TouchableOpacity>

      {/* PIN modal - only when user taps Booking */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPinModal(false)}
        >
          <TouchableOpacity
            style={styles.modalBox}
            activeOpacity={1}
            onPress={() => {}}
          >
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
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setShowPinModal(false);
                    setPin('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBook}
                  onPress={handleBookWithPin}
                  disabled={booking}
                >
                  <Text style={styles.bookButtonText}>
                    {booking ? 'Booking…' : 'Book'}
                  </Text>
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
  content: { paddingBottom: 24 },
  muted: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  imageWrap: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#e2e8f0' },
  imageScroll: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
  detailImage: { height: IMAGE_HEIGHT, width: SCREEN_WIDTH },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#94a3b8', fontSize: 14 },
  slideIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  slideIndicatorText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  desc: { color: '#64748b', marginBottom: 8, paddingHorizontal: 20 },
  body: { color: '#0f172a', marginBottom: 16, paddingHorizontal: 20, lineHeight: 22 },
  price: { fontWeight: '600', color: '#2F7DFF', marginBottom: 12, paddingHorizontal: 20 },
  addOns: { marginBottom: 16, paddingHorizontal: 20 },
  addOnsTitle: { fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  addOnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addOnSelected: { borderColor: '#2F7DFF', backgroundColor: 'rgba(47, 125, 255, 0.06)' },
  addOnName: { color: '#0f172a' },
  addOnDelta: { color: '#2F7DFF' },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  pinInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 18,
    color: '#0f172a',
  },
  modalButtons: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCancelText: { color: '#64748b', fontWeight: '600' },
  modalBook: {
    backgroundColor: '#2F7DFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
