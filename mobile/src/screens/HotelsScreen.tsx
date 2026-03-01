import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, resolveImageUrl } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const IMAGE_HEIGHT = 100;

type Hotel = { id: string; name: string; location: string | null; imageUrl: string | null; imageUrls?: string[] | null; pricePerNight: number | null; currency: string };

export default function HotelsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const list = await api<Hotel[]>('/hotels').catch(() => []);
      setHotels(Array.isArray(list) ? list : []);
    } catch {
      setHotels([]);
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
      <Text style={styles.title}>Hotels</Text>
      {loading && !refreshing ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : hotels.length === 0 ? (
        <Text style={styles.muted}>No hotels yet.</Text>
      ) : (
        <View style={styles.grid}>
          {hotels.map((h) => (
            <TouchableOpacity
              key={h.id}
              style={styles.card}
              onPress={() => navigation.getParent()?.navigate('HotelDetail', { hotelId: h.id })}
              activeOpacity={0.9}
            >
              <View style={styles.cardImageWrap}>
                {(h.imageUrls?.[0] ?? h.imageUrl) ? (
                  <Image
                    source={{ uri: resolveImageUrl(h.imageUrls?.[0] ?? h.imageUrl ?? '') }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.placeholder]}>
                    <Text style={styles.placeholderText}>🏨</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{h.name}</Text>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.15)',
  },
  cardImageWrap: { width: CARD_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#e2e8f0' },
  cardImage: { width: CARD_WIDTH, height: IMAGE_HEIGHT },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 28 },
  cardTitle: { color: '#0f172a', fontWeight: '600', fontSize: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
});
