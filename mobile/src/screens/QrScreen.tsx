import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../api';

/** Same QR payload as admin customer detail - POS can scan to identify customer. */
export default function QrScreen() {
  const [payload, setPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api<{ payload: string }>('/customers/me/qr-payload')
      .then((data) => {
        if (!cancelled) setPayload(data.payload);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Show at till</Text>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : payload ? (
        <View style={styles.qrBox}>
          <QRCode value={payload} size={220} color="#0f172a" backgroundColor="#fff" />
          <Text style={styles.hint}>Scan at POS to identify you</Text>
        </View>
      ) : (
        <Text style={styles.muted}>Loading…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  error: { color: '#dc2626', textAlign: 'center' },
  muted: { color: '#64748b', textAlign: 'center' },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(47, 125, 255, 0.2)',
    shadowColor: '#2F7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  hint: { color: '#64748b', fontSize: 12, marginTop: 16, textAlign: 'center' },
});
