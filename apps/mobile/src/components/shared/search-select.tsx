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

type Props<T> = {
  items: T[];
  selectedId?: string;
  idSelector: (item: T) => string;
  nameSelector: (item: T) => string;
  onSelect: (item: T) => void;
  style?: ViewStyle | ViewStyle[];
  placeholder?: string;
  searchable?: boolean;
};

export function SearchSelect<T>({
  items,
  selectedId,
  idSelector,
  nameSelector,
  onSelect,
  style,
  placeholder,
  searchable = true,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selectedItem = items.find((item) => idSelector(item) === selectedId);
  const selectedLabel = selectedItem
    ? nameSelector(selectedItem)
    : (placeholder ?? 'Select…');

  const filtered = useMemo(() => {
    if (!searchable) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const n = nameSelector(item).toLowerCase();
      const stripped = n.replace(/^\d+\s+/, '');
      return (
        n.startsWith(q) ||
        stripped.startsWith(q) ||
        idSelector(item).toLowerCase().startsWith(q)
      );
    });
  }, [items, query, searchable, idSelector, nameSelector]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const commit = (item: T) => {
    onSelect(item);
    close();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={selectedLabel}
        accessibilityHint="Opens a list of options"
        style={[styles.trigger, style]}
      >
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
          if (searchable) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {searchable && (
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel="Search options"
                style={styles.input}
              />
            )}
            <FlatList
              data={filtered}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => idSelector(item)}
              ListEmptyComponent={
                <Text style={styles.empty}>No matches</Text>
              }
              renderItem={({ item }) => {
                const isSelected = idSelector(item) === selectedId;
                return (
                  <Pressable
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => commit(item)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.rowText,
                        isSelected && styles.rowTextSelected,
                      ]}
                    >
                      {nameSelector(item)}
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
