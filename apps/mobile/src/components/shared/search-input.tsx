import { StyleSheet, TextInput, View } from 'react-native';

import { LoadingSpinner } from './loading-spinner';

type Props = {
  placeholder?: string;
  isLoading?: boolean;
  onSearch?: (value: string) => void;
};

export function SearchInput({ placeholder, isLoading, onSearch }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholder={placeholder ?? 'Search...'}
        style={styles.input}
        editable={!isLoading}
        onChangeText={onSearch}
        placeholderTextColor="#9CA3AF"
      />
      {isLoading ? (
        <View style={styles.icon}>
          <LoadingSpinner size="small" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 40,
    fontSize: 14,
  },
  icon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
