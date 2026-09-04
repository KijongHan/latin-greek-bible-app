import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { bookNameLookup } from '@bible-app/domain';

type Props = {
  bookIds: string[];
  selectedBookId?: string;
  onSelect: (bookId: string) => void;
  style?: ViewStyle | ViewStyle[];
  placeholder?: string;
};

type BookOption = { id: string; name: string };

export function BookSearchSelect({
  bookIds,
  selectedBookId,
  onSelect,
  style,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selectedLabel = selectedBookId
    ? (bookNameLookup.get(selectedBookId) ?? selectedBookId)
    : (placeholder ?? 'Select book');

  const filtered = useMemo<BookOption[]>(() => {
    const items: BookOption[] = bookIds.map((id) => ({
      id,
      name: bookNameLookup.get(id) ?? id,
    }));
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(({ id, name }) => {
      const n = name.toLowerCase();
      const stripped = n.replace(/^\d+\s+/, '');
      return (
        n.startsWith(q) ||
        stripped.startsWith(q) ||
        id.toLowerCase().startsWith(q)
      );
    });
  }, [bookIds, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const commit = (id: string) => {
    onSelect(id);
    close();
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.trigger, style]}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={close}
        onShow={() => {
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search books…"
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.input}
            />
            <FlatList
              data={filtered}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>No matches</Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === selectedBookId;
                return (
                  <Pressable
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => commit(item.id)}
                  >
                    <Text
                      style={[
                        styles.rowText,
                        isSelected && styles.rowTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  caret: {
    fontSize: 12,
    color: '#4B5563',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    color: '#111827',
  },
  empty: {
    padding: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowSelected: {
    backgroundColor: '#EFF6FF',
  },
  rowText: {
    fontSize: 15,
    color: '#111827',
  },
  rowTextSelected: {
    fontWeight: '600',
    color: '#1D4ED8',
  },
});
