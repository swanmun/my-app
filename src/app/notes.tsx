// src/app/notes.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    Text,
    TextInput,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { notesStyles } from '../styles/notes';

type Note = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
};

export default function NotesScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getNotes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('메모 조회 실패', error.message);
    } else {
      setNotes(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    getNotes();
  }, []);

  const createNote = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert('입력 확인', '메모 내용을 입력해주세요.');
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('로그인 필요', '로그인 정보를 찾지 못했습니다.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('notes').insert({
      content: trimmedContent,
      user_id: user.id,
    });

    if (error) {
      Alert.alert('메모 등록 실패', error.message);
    } else {
      setContent('');
      await getNotes();
    }

    setSaving(false);
  };

  const deleteNote = async (noteId: number) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      Alert.alert('삭제 실패', error.message);
    } else {
      await getNotes();
    }
  };

  const handleDelete = (noteId: number) => {
    Alert.alert(
      '메모 삭제',
      '정말 이 메모를 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteNote(noteId),
        },
      ],
    );
  };

  return (
    <View style={notesStyles.container}>
      <Text style={notesStyles.title}>내 메모</Text>

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="새 메모를 입력하세요."
        style={notesStyles.input}
        multiline
      />

      <Button
        title={saving ? '등록 중...' : '메모 등록'}
        onPress={createNote}
        disabled={saving}
      />

      <View style={notesStyles.listHeader}>
        <Text style={notesStyles.listTitle}>내가 등록한 메모</Text>
        <Button title="새로고침" onPress={getNotes} />
      </View>

      {loading ? (
        <Text style={notesStyles.emptyText}>메모를 불러오는 중입니다.</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={notesStyles.list}
          ListEmptyComponent={
            <Text style={notesStyles.emptyText}>
              아직 등록한 메모가 없습니다.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={notesStyles.noteItem}>
              <Text style={notesStyles.noteContent}>{item.content}</Text>
              <Text style={notesStyles.date}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
              <Button
                title="삭제"
                color="#d9534f"
                onPress={() => handleDelete(item.id)}
              />
            </View>
          )}
        />
      )}

      <Button title="홈으로" onPress={() => router.replace('/')} />
    </View>
  );
}