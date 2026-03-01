import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { api } from '../api';

type Message = { id: string; sender: string; body: string; createdAt: string };

export default function ChatScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  const threadId = (route.params as any)?.threadId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    if (!threadId) return;
    try {
      const thread = await api<{ messages?: Message[] }>(`/messages/threads/${threadId}/messages`);
      setMessages(thread?.messages ?? []);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    load();
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages]);

  async function send() {
    if (!threadId || !body.trim()) return;
    setSending(true);
    try {
      await api(`/messages/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ body: body.trim() }) });
      setBody('');
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={Platform.OS === 'android' ? 20 : 0}
      extraHeight={20}
      enableAutomaticScroll
    >
      <View style={styles.messagesContent}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.msg, m.sender === 'support' ? styles.msgSupport : styles.msgCustomer]}>
            <Text style={styles.msgSender}>{m.sender}</Text>
            <Text style={styles.msgBody}>{m.body}</Text>
            <Text style={styles.msgDate}>{new Date(m.createdAt).toLocaleString()}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a message…"
          placeholderTextColor="#94a3b8"
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending || !body.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { flexGrow: 1, paddingBottom: 24 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  msg: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '85%' },
  msgSupport: { alignSelf: 'flex-start', backgroundColor: 'rgba(47, 125, 255, 0.12)' },
  msgCustomer: { alignSelf: 'flex-end', backgroundColor: '#e2e8f0' },
  msgSender: { fontWeight: '600', fontSize: 12, color: '#64748b' },
  msgBody: { color: '#0f172a', marginTop: 2 },
  msgDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  inputRow: { flexDirection: 'row', padding: 16, gap: 8, borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, color: '#0f172a' },
  sendBtn: { backgroundColor: '#2F7DFF', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
