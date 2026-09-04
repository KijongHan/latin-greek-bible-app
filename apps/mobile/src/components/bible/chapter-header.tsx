import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { bookNameLookup, useBibleAudioStore, useBibleStore } from '@bible-app/domain';

import { CircleButton, CircleContainer } from '@/components/shared/circle-button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { SearchSelect } from '@/components/shared/search-select';
import { booksWithAudio } from '@/constants/bible.data';

export function ChapterHeader() {
  const {
    clear,
    showGlossText,
    sharedBooks,
    mainSource,
    setChapter,
    setBook,
    setShowGlossText,
  } = useBibleStore();
  const {
    isLoading: isLoadingAudio,
    isAudioEnabled,
    setIsAudioEnabled,
    isAudioPlaying,
  } = useBibleAudioStore();

  const bookItems = useMemo(
    () =>
      (sharedBooks ?? []).map((id) => ({
        id,
        name: bookNameLookup.get(id) ?? id,
      })),
    [sharedBooks],
  );

  if (!mainSource?.book || !mainSource?.chapter) return null;

  const bookId = mainSource.book.id;
  const showAudioButton = booksWithAudio.includes(bookId);
  const audioBg = isAudioEnabled
    ? isAudioPlaying
      ? '#22C55E'
      : '#EAB308'
    : '#ffffff';

  return (
    <View style={styles.header}>
      <View style={styles.selectors}>
        <View style={styles.selectorItem}>
          <SearchSelect
            items={bookItems}
            selectedId={bookId}
            idSelector={(b) => b.id}
            nameSelector={(b) => b.name}
            onSelect={(b) => setBook(b.id)}
          />
        </View>
        <View style={styles.selectorItem}>
          <SearchSelect
            items={mainSource.book.chapters ?? []}
            selectedId={mainSource.chapter.id}
            idSelector={(chapter) => chapter}
            nameSelector={(chapter) => chapter.split('.')[1]}
            onSelect={(chapter) => setChapter(chapter)}
            searchable={false}
          />
        </View>
      </View>
      <View style={styles.buttons}>
        <CircleButton onPress={() => clear()} icon={<Text style={styles.icon}>⌂</Text>} />
        <CircleButton
          onPress={() => setShowGlossText(!showGlossText)}
          icon={<Text style={styles.icon}>{showGlossText ? '≡' : '☰'}</Text>}
        />
        {showAudioButton ? (
          isLoadingAudio ? (
            <CircleContainer icon={<LoadingSpinner size="small" />} />
          ) : (
            <CircleButton
              onPress={() => setIsAudioEnabled(!isAudioEnabled)}
              style={{ backgroundColor: audioBg }}
              icon={
                <Text
                  style={[
                    styles.icon,
                    isAudioEnabled ? styles.iconOnAudio : null,
                  ]}
                >
                  ⏵
                </Text>
              }
            />
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  selectors: { flexDirection: 'row', gap: 8, flex: 1 },
  selectorItem: { flex: 1 },
  buttons: { flexDirection: 'row', gap: 6 },
  icon: { fontSize: 16, color: '#111827' },
  iconOnAudio: { color: '#ffffff' },
});
