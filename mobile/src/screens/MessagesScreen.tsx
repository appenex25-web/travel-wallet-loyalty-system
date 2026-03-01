import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

type Message = { id: string; sender: string; body: string; createdAt: string };
type Thread = {
  id: string
  type: string
  subject: string | null
  bookingId: string | null
  createdAt: string
  messages?: Message[]
}

function openChat(navigation: ReturnType<typeof useNavigation>, threadId: string) {
  const stack = navigation.getParent();
  if (stack) (stack as any).navigate('Chat', { threadId });
  else (navigation as any).navigate('Chat', { threadId });
}

export default function MessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  async function load() {
    try {
      const list = await api<Thread[]>('/messages/threads/me');
      setThreads(Array.isArray(list) ? list : []);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Poll thread list so new messages appear without reload (every 4s)
  useEffect(() => {
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  const supportThreads = threads.filter((t) => t.type === 'support');
  const notifications = threads.filter((t) => t.type === 'booking_notification');

  const lastMessage = (t: Thread) => {
    const ms = t.messages;
    if (!ms?.length) return null;
    return ms[ms.length - 1];
  };

  async function startChatToSupport() {
    if (startingChat) return;
    setStartingChat(true);
    try {
      const thread = await api<Thread>('/messages/threads', {
        method: 'POST',
        body: JSON.stringify({ type: 'support', subject: 'Support' }),
      });
      load();
      openChat(navigation, thread.id);
    } catch {
      const first = supportThreads[0];
      if (first) {
        openChat(navigation, first.id);
      } else {
        Alert.alert('Could not start chat', 'Check your connection and that the API is running. On a device, set EXPO_PUBLIC_API_URL to your computer IP (e.g. http://192.168.1.x:3000).');
      }
    } finally {
      setStartingChat(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2F7DFF" />}
    >
      <Text style={styles.title}>Messages</Text>

      <TouchableOpacity style={styles.supportButton} onPress={startChatToSupport} disabled={startingChat}>
        <Text style={styles.supportButtonText}>{startingChat ? 'Opening…' : 'Chat to support'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your chats</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : supportThreads.length === 0 ? (
        <Text style={styles.muted}>No chats yet. Tap "Chat to support" to start.</Text>
      ) : (
        supportThreads.map((t) => {
          const last = lastMessage(t);
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.card}
              onPress={() => openChat(navigation, t.id)}
            >
              <Text style={styles.cardType}>Support</Text>
              {last ? <Text style={styles.cardPreview} numberOfLines={1}>{last.body}</Text> : null}
              <Text style={styles.cardDate}>{new Date(t.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notifications</Text>
      {loading ? null : notifications.length === 0 ? (
        <Text style={styles.muted}>No booking notifications yet.</Text>
      ) : (
        notifications.map((t) => {
          const last = lastMessage(t);
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.notifCard}
              onPress={() => openChat(navigation, t.id)}
            >
              <Text style={styles.notifTitle}>Booking update</Text>
              {last ? <Text style={styles.notifBody}>{last.body}</Text> : null}
              <Text style={styles.cardDate}>{new Date(t.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  supportButton: {
    backgroundColor: '#2F7DFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  supportButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  muted: { color: '#64748b', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardType: { fontWeight: '600', color: '#0f172a' },
  cardPreview: { color: '#64748b', marginTop: 4, fontSize: 14 },
  cardDate: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#2F7DFF',
  },
  notifTitle: { fontWeight: '600', color: '#2F7DFF' },
  notifBody: { color: '#0f172a', marginTop: 4 },
});
