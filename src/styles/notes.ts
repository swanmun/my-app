// src/styles/notes.ts
import { StyleSheet } from "react-native";

export const notesStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },

  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  list: {
    gap: 10,
    paddingBottom: 12,
  },

  noteItem: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },

  noteContent: {
    fontSize: 16,
    lineHeight: 22,
  },

  date: {
    color: "#64748b",
    fontSize: 12,
  },

  deleteButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 24,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },

  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },

  noteImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    resizeMode: "cover",
  },
});
