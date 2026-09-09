// src/app/_layout.tsx
import { Session } from '@supabase/supabase-js';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // 로그인 안 되어 있고, (auth) 그룹이 아니면 로그인 화면으로
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      // 로그인 되어 있고 (auth) 그룹이면 홈으로
      router.replace('/');
    }
  }, [session, loading]);

  if (loading) return null; // 또는 로딩 UI

  return <Slot />;
}