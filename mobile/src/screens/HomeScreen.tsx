import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, TextInput, Image, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getApiBase, resolveImageUrl } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
/** 2 campaigns per row like Trip.com reference */
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const IMAGE_HEIGHT = 120;

type Campaign = { id: string; title: string; shortDescription: string | null; imageUrls: string[] | null; basePrice: number; currency: string };

const SLIDE_INTERVAL_MS = 5000;

function CampaignCard({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const images = (campaign.imageUrls && campaign.imageUrls.length > 0)
    ? campaign.imageUrls
    : [];
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setSlideIndex((prev) => {
        const next = prev + 1 >= images.length ? 0 : prev + 1;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / CARD_WIDTH);
    setSlideIndex(Math.min(Math.max(0, index), images.length - 1));
  };

  return (
    <TouchableOpacity style={styles.campaignCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardImageWrap}>
        {images.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
            style={styles.cardImageScroll}
            contentContainerStyle={styles.cardImageContent}
          >
            {images.map((uri, i) => (
              <Image key={i} source={{ uri: resolveImageUrl(uri) }} style={[styles.cardImage, { width: CARD_WIDTH }]} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder, { width: CARD_WIDTH }]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>
      <Text style={styles.campaignTitle} numberOfLines={2}>{campaign.title}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [balance, setBalance] = useState<{ balance: number; currency: string } | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    try {
      const [bal, pts, camp] = await Promise.all([
        api<{ balance: number; currency: string }>('/wallet/me'),
        api<number>('/points/me'),
        api<Campaign[]>('/campaigns').catch(() => []),
      ]);
      setBalance(bal);
      setPoints(pts);
      setCampaigns(Array.isArray(camp) ? camp : []);
    } catch (e) {
      setBalance(null);
      setPoints(null);
      setCampaigns([]);
      setLoadError(e instanceof Error ? e.message : 'Could not load. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Extra gap below safe area so header text clears camera island/notch (~1cm)
  const EXTRA_TOP = 36;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollFill}
        contentContainerStyle={[styles.content, { paddingTop: EXTRA_TOP }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2F7DFF" />
        }
      >
      {loadError ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.errorSubtext}>API: {getApiBase()}</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.brand}>Travel Wallet</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.walletChip} onPress={() => navigation.getParent()?.navigate('Wallet')}>
            <Text style={styles.walletText}>{balance != null ? `${balance.currency} ${Number(balance.balance).toFixed(2)}` : (loading ? '…' : '—')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton} onPress={() => navigation.getParent()?.navigate('Scan')}>
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <View style={styles.actionsRow}>
        {[
          { label: 'Hotels', icon: '🏨', route: 'Hotels' as const },
          { label: 'Flights', icon: '✈️', route: 'Flights' as const },
          { label: 'Transport', icon: '🚌', route: null },
          { label: 'Attractions', icon: '🎯', route: null },
          { label: 'Car rentals', icon: '🚗', route: null },
        ].map(({ label, icon, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.actionChip}
            onPress={() => route && navigation.getParent()?.navigate(route as any)}
          >
            <Text style={styles.actionIcon}>{icon}</Text>
            <Text style={styles.actionChipText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.search} placeholder="Search trips, hotels, flights…" placeholderTextColor="#94a3b8" />

      <Text style={styles.sectionTitle}>Where to next?</Text>
      {loading && !loadError ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : campaigns.length === 0 ? (
        <Text style={styles.muted}>No campaigns yet.</Text>
      ) : (
        <View style={styles.campaignGrid}>
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onPress={() => navigation.getParent()?.navigate('CampaignDetail', { campaignId: c.id })}
            />
          ))}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollFill: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  errorBlock: { marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 4 },
  errorSubtext: { color: '#64748b', fontSize: 11 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  headerDivider: { height: 1, backgroundColor: 'rgba(47, 125, 255, 0.2)', marginBottom: 16 },
  brand: { fontSize: 20, fontWeight: '700', color: '#2F7DFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletChip: { backgroundColor: 'rgba(47, 125, 255, 0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  walletText: { color: '#0f172a', fontWeight: '600', fontSize: 14 },
  scanButton: { backgroundColor: '#2F7DFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  scanButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  actionChip: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 18 },
  actionChipText: { color: '#0f172a', fontSize: 13 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#0f172a',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  muted: { color: '#64748b', marginBottom: 16 },
  campaignGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -GAP / 2,
    gap: GAP,
  },
  campaignCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.15)',
  },
  cardImageWrap: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#e2e8f0',
  },
  cardImageScroll: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  cardImageContent: {},
  cardImage: {
    height: IMAGE_HEIGHT,
  },
  cardImagePlaceholder: {
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  placeholderText: { color: '#94a3b8', fontSize: 12 },
  campaignTitle: { color: '#0f172a', fontWeight: '600', fontSize: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
});
