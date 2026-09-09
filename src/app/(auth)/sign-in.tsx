// src/app/(auth)/sign-in.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { signInStyles } from '../../styles/signIn';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('회원가입이 완료되었습니다. 로그인해주세요.');
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace('/');
    setLoading(false);
  };

  return (
    <View style={signInStyles.container}>
      <Text style={signInStyles.title}>로그인 / 회원가입</Text>

      <Text style={signInStyles.label}>이메일</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={signInStyles.input}
        placeholder="example@email.com"
      />

      <Text style={signInStyles.label}>비밀번호</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={signInStyles.input}
        placeholder="6 자리 이상"
      />

      {error && <Text style={signInStyles.error}>{error}</Text>}
      {message && <Text style={signInStyles.message}>{message}</Text>}

      <View style={signInStyles.buttonRow}>
        <Button title="회원가입" onPress={handleSignUp} disabled={loading} />
        <Button title="로그인" onPress={handleSignIn} disabled={loading} />
      </View>

      <Button title="홈으로" onPress={() => router.replace('/')} />
    </View>
  );
}