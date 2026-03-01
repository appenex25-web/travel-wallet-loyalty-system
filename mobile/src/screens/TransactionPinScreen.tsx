import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api';

type RootStack = { Main: undefined; TransactionPin: { hasPin?: boolean } };
type Props = NativeStackScreenProps<RootStack, 'TransactionPin'>;

const PIN_LEN = 6;
const PIN_REGEX = /^\d{6}$/;

export default function TransactionPinScreen({ navigation, route }: Props) {
  const [hasPin, setHasPin] = useState<boolean>(route.params?.hasPin ?? false);
  const [loadingHasPin, setLoadingHasPin] = useState(typeof route.params?.hasPin !== 'boolean');
  const [oldPin, setOldPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof route.params?.hasPin === 'boolean') {
      setHasPin(route.params.hasPin);
      setLoadingHasPin(false);
      return;
    }
    api<{ hasPin: boolean }>('/customers/me/has-pin')
      .then((r) => {
        setHasPin(r.hasPin);
      })
      .catch(() => setHasPin(false))
      .finally(() => setLoadingHasPin(false));
  }, [route.params?.hasPin]);

  function validate(): boolean {
    if (hasPin) {
      if (!PIN_REGEX.test(oldPin)) {
        Alert.alert('Invalid PIN', 'Enter your current 6-digit PIN.');
        return false;
      }
    }
    if (!PIN_REGEX.test(pin)) {
      Alert.alert('Invalid PIN', 'New PIN must be exactly 6 digits.');
      return false;
    }
    if (pin !== confirmPin) {
      Alert.alert('PINs do not match', 'New PIN and confirmation must match.');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await api<{ ok: boolean }>('/customers/me/pin', {
        method: 'POST',
        body: JSON.stringify(
          hasPin
            ? { pin, confirmPin, oldPin }
            : { pin, confirmPin }
        ),
      });
      Alert.alert('Done', hasPin ? 'Transaction PIN updated.' : 'Transaction PIN set. Use it when booking or paying with wallet.');
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Could not save PIN.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingHasPin) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F7DFF" />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {hasPin ? 'Change transaction PIN' : 'Create transaction PIN'}
      </Text>
      <Text style={styles.subtitle}>
        {hasPin
          ? 'Enter your current PIN and choose a new 6-digit PIN for bookings and wallet payments.'
          : 'Set a 6-digit PIN. You will use it when making bookings and when paying with your wallet.'}
      </Text>
      {hasPin && (
        <TextInput
          style={styles.input}
          placeholder="Current PIN (6 digits)"
          placeholderTextColor="#64748b"
          value={oldPin}
          onChangeText={(t) => setOldPin(t.replace(/\D/g, '').slice(0, PIN_LEN))}
          keyboardType="number-pad"
          maxLength={PIN_LEN}
          secureTextEntry
        />
      )}
      <TextInput
        style={styles.input}
        placeholder={hasPin ? 'New PIN (6 digits)' : 'PIN (6 digits)'}
        placeholderTextColor="#64748b"
        value={pin}
        onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, PIN_LEN))}
        keyboardType="number-pad"
        maxLength={PIN_LEN}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm PIN (6 digits)"
        placeholderTextColor="#64748b"
        value={confirmPin}
        onChangeText={(t) => setConfirmPin(t.replace(/\D/g, '').slice(0, PIN_LEN))}
        keyboardType="number-pad"
        maxLength={PIN_LEN}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving…' : hasPin ? 'Update PIN' : 'Create PIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 20,
  },
  muted: { color: '#64748b', marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#2F7DFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});
