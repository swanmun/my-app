import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Platform,
  Pressable,
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
  image_path: string | null;
};

type NoteSummary = {
  userId: string;
  noteCount: number;
  imageCount: number;
};

export default function NotesScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<NoteSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

  const getNoteSummary = async () => {
    setSummaryLoading(true);

    const { data, error } =
      await supabase.functions.invoke<NoteSummary>('note-summary');

    if (error) {
      console.error('Edge Function 호출 실패:', error);
      Alert.alert('통계 조회 실패', error.message);
    } else {
      console.log('Edge Function 응답:', data);
      setSummary(data);
    }

    setSummaryLoading(false);
  };

  useEffect(() => {
    getNotes();
    getNoteSummary();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribeToMyNotes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`notes-user-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            getNotes();
            getNoteSummary();
          },
        )
        .subscribe((status) => {
          console.log('내 notes Realtime 상태:', status);
        });
    };

    subscribeToMyNotes();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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
      await getNoteSummary();
    }

    setSaving(false);
  };

  const deleteNote = async (noteId: number) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('삭제 실패', '로그인 정보를 확인할 수 없습니다.');
      return;
    }

    const { data, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      Alert.alert('삭제 오류', error.message);
      return;
    }

    if (!data || data.length === 0) {
      Alert.alert(
        '삭제되지 않음',
        '조건에 맞는 메모가 없습니다. 본인이 작성한 메모인지 확인해주세요.',
      );
      return;
    }

    setNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== noteId),
    );

    await getNoteSummary();
  };

  const handleDelete = (noteId: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('정말 이 메모를 삭제할까요?');

      if (confirmed) {
        void deleteNote(noteId);
      }

      return;
    }

    Alert.alert('메모 삭제', '정말 이 메모를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void deleteNote(noteId);
        },
      },
    ]);
  };

  return (
    <View style={notesStyles.container}>
      <Text style={notesStyles.title}>내 메모</Text>

      {summaryLoading ? (
        <Text>통계를 불러오는 중입니다.</Text>
      ) : summary ? (
        <View>
          <Text>전체 메모: {summary.noteCount}개</Text>
          <Text>사진 메모: {summary.imageCount}개</Text>
        </View>
      ) : null}

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
        <Button
          title="새로고침"
          onPress={() => {
            void getNotes();
            void getNoteSummary();
          }}
        />
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
              <Pressable
                accessibilityRole="button"
                onPress={() => handleDelete(item.id)}
                style={notesStyles.deleteButton}
              >
                <Text style={notesStyles.deleteButtonText}>삭제</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Button title="홈으로" onPress={() => router.replace('/')} />
    </View>
  );
}