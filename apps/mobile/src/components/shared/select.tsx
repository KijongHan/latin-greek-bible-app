import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

type Props<T> = {
  items: T[];
  selectedId?: string;
  idSelector: (item: T) => string;
  nameSelector: (item: T) => string;
  onSelect: (item: T) => void;
  hideId?: string;
  style?: ViewStyle | ViewStyle[];
  placeholder?: string;
};

export function Select<T>({
  items,
  selectedId,
  idSelector,
  nameSelector,
  onSelect,
  hideId,
  style,
  placeholder,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find((item) => idSelector(item) === selectedId);
  const visibleItems = hideId
    ? items.filter((item) => idSelector(item) !== hideId)
    : items;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, style]}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {selectedItem ? nameSelector(selectedItem) : placeholder ?? 'Select...'}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <FlatList
              data={visibleItems}
              keyExtractor={(item) => idSelector(item)}
              renderItem={({ item }) => {
                const isSelected = idSelector(item) === selectedId;
                return (
                  <Pressable
                    style={[
                      styles.row,
                      isSelected && styles.rowSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
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
