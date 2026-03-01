import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../api';

export default function WriteReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const bookingId = (route.params as any)?.bookingId;
  const title = (route.params as any)?.title ?? 'Booking';
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!bookingId || !body.trim()) return;
    setSubmitting(true);
    try {
      await api('/posts', { method: 'POST', body: JSON.stringify({ bookingId, body: body.trim() }) });
      Alert.alert('Submitted', 'Thanks for your review!');
      (navigation as any).goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review: {title}</Text>
      <TextInput
        style={styles.input}
        value={body}
        onChangeText={setBody}
        placeholder="Share your experience…"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={6}
      />
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={submitting || !body.trim()}>
        <Text style={styles.btnText}>{submitting ? 'Submitting…' : 'Submit review'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, color: '#0f172a', minHeight: 120, textAlignVertical: 'top' },
  btn: { marginTop: 20, backgroundColor: '#2F7DFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
