// src/app/index.tsx
import { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { homeStyles } from '../styles/home';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={homeStyles.container}>
      <Text style={homeStyles.title}>홈</Text>

      {user ? (
        <>
          <Text style={homeStyles.text}>로그인된 계정:</Text>
          <Text style={homeStyles.email}>{user.email}</Text>

          <Button
            title="내 메모"
            onPress={() => router.push('/notes')}
          />

          <Button
            title="비밀번호 변경"
            onPress={() => router.push('/profile')}
          />
          <Button title="로그아웃" onPress={handleLogout} />
        </>
      ) : (
        <>
          <Text style={homeStyles.text}>로그인이 필요합니다.</Text>
          <Button title="로그인하기" onPress={() => router.push('/(auth)/sign-in')} />
        </>
      )}
    </View>
  );
}