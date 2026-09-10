// src/app/notes.tsx
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { notesStyles } from "../styles/notes";

type Note = {
  id: number;
  user_id: string;
  content: string;
  image_path: string | null;
  created_at: string;
};

export default function NotesScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getNotes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("메모 조회 실패", error.message);
      setNotes([]);
    } else {
      setNotes(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    getNotes();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "권한 필요",
        "사진을 선택하려면 사진 라이브러리 접근 권한을 허용해주세요.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    setSelectedImageUri(result.assets[0].uri);
  };

  const uploadImage = async (userId: string, imageUri: string) => {
    // 웹의 blob: URI는 확장자가 없으므로 안전하게 jpg로 저장합니다.
    const filePath = `${userId}/${Date.now()}.jpg`;

    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from("note-images")
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return filePath;
  };

  const getImageUrl = async (imagePath: string) => {
    const { data, error } = await supabase.storage
      .from("note-images")
      .createSignedUrl(imagePath, 60 * 60);

    if (error) return null;

    return data.signedUrl;
  };

  const createNote = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent && !selectedImageUri) {
      Alert.alert("입력 확인", "메모 내용 또는 사진을 등록해주세요.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert("로그인 필요", "로그인 정보를 확인할 수 없습니다.");
      setSaving(false);
      return;
    }

    try {
      let imagePath: string | null = null;

      if (selectedImageUri) {
        imagePath = await uploadImage(user.id, selectedImageUri);
      }

      const { error } = await supabase.from("notes").insert({
        content: trimmedContent,
        user_id: user.id,
        image_path: imagePath,
      });

      if (error) {
        // DB 저장 실패 시, 방금 올린 고아 이미지 파일을 삭제합니다.
        if (imagePath) {
          await supabase.storage.from("note-images").remove([imagePath]);
        }

        throw new Error(error.message);
      }

      setContent("");
      setSelectedImageUri(null);
      await getNotes();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";

      Alert.alert("메모 등록 실패", message);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note: Note) => {
    console.log("삭제 시작");
    console.log("삭제할 메모:", note);
    console.log("삭제할 메모 ID:", note.id);
    console.log("삭제할 이미지 경로:", note.image_path);

    const { error: deleteNoteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", note.id);

    console.log("DB 메모 삭제 오류:", deleteNoteError);

    if (deleteNoteError) {
      Alert.alert("메모 삭제 실패", deleteNoteError.message);
      return;
    }

    console.log("DB 메모 삭제 성공");

    if (note.image_path) {
      console.log("Storage 사진 삭제 시작:", note.image_path);

      const { error: deleteImageError } = await supabase.storage
        .from("note-images")
        .remove([note.image_path]);

      console.log("Storage 사진 삭제 오류:", deleteImageError);

      if (deleteImageError) {
        Alert.alert(
          "사진 삭제 안내",
          "메모는 삭제되었지만 사진 삭제에는 실패했습니다: " +
            deleteImageError.message,
        );
      } else {
        console.log("Storage 사진 삭제 성공");
      }
    }

    await getNotes();
    console.log("목록 새로고침 완료");
  };

  const handleDelete = (note: Note) => {
    // 웹 브라우저에서 실행 중인 경우
    if (Platform.OS === "web") {
      const isConfirmed = window.confirm(
        "메모와 연결된 사진도 함께 삭제됩니다.\n정말 삭제할까요?",
      );

      if (isConfirmed) {
        deleteNote(note);
      }

      return;
    }

    // Android / iOS 앱에서 실행 중인 경우
    Alert.alert("메모 삭제", "메모와 연결된 사진도 함께 삭제됩니다.", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteNote(note),
      },
    ]);
  };

  return (
    <View style={notesStyles.container}>
      <Text style={notesStyles.title}>사진 메모</Text>

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="메모를 입력하세요."
        multiline
        style={notesStyles.input}
      />

      <View style={notesStyles.buttonRow}>
        <Button title="사진 선택" onPress={pickImage} disabled={saving} />
        {selectedImageUri && (
          <Button
            title="사진 취소"
            color="#d9534f"
            onPress={() => setSelectedImageUri(null)}
            disabled={saving}
          />
        )}
      </View>

      {selectedImageUri && (
        <Image
          source={{ uri: selectedImageUri }}
          style={notesStyles.previewImage}
        />
      )}

      <Button
        title={saving ? "등록 중..." : "메모 등록"}
        disabled={saving}
        onPress={createNote}
      />

      <View style={notesStyles.listHeader}>
        <Text style={notesStyles.listTitle}>내가 작성한 메모</Text>
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
            <NoteItem note={item} onDelete={() => handleDelete(item)} />
          )}
        />
      )}

      <Button title="홈으로" onPress={() => router.replace("/")} />
    </View>
  );
}

function NoteItem({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!note.image_path) return;

    const loadImageUrl = async () => {
      const { data, error } = await supabase.storage
        .from("note-images")
        .createSignedUrl(note.image_path!, 60 * 60);

      if (!error) {
        setImageUrl(data.signedUrl);
      }
    };

    loadImageUrl();
  }, [note.image_path]);

  return (
    <View style={notesStyles.noteItem}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={notesStyles.noteImage} />
      )}

      {note.content ? (
        <Text style={notesStyles.noteContent}>{note.content}</Text>
      ) : null}

      <Text style={notesStyles.date}>
        {new Date(note.created_at).toLocaleString()}
      </Text>

      <Button title="삭제" color="#d9534f" onPress={onDelete} />
    </View>
  );
}
