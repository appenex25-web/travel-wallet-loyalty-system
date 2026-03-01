import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, setToken } from '../api';

type RootStack = { Login: undefined; SignUp: undefined; Main: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStack, 'SignUp'> };

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !name) {
      Alert.alert('Missing fields', 'Email, password and name are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, phone: phone || undefined }),
        token: null,
      });
      await setToken(data.access_token);
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Sign up failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Phone (optional)"
        placeholderTextColor="#64748b"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Sign up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.replace('Login')}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
