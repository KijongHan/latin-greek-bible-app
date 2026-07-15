import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore, useBibleAudioStore, useBibleStore } from '@bible-app/domain';

export function ChapterPage() {
  const { isScrolled } = useAppStore();
  const { currentBibleVerseId, isAudioPlaying } = useBibleAudioStore();
  const { mainSource, glossSource, showGlossText } = useBibleStore();

  const activeStyle = (bibleId?: string, verseId?: string) => {
    const isActive =
      currentBibleVerseId === `${bibleId}.${verseId}`;
    if (!isActive) return undefined;
    return { color: isAudioPlaying ? '#22C55E' : '#EAB308' };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!isScrolled && (
        <Text style={styles.chapterTitle}>
          {mainSource?.book?.name} {mainSource?.chapter?.number}
        </Text>
      )}
      <View style={styles.verses}>
        {mainSource?.chapter?.verses?.map((verse, index) => {
          const mainActive = activeStyle(mainSource?.bible?.id, verse.id);
          const glossActive = activeStyle(glossSource?.bible?.id, verse.id);
          const glossVerseText = glossSource?.chapter?.verses?.[index]?.tokens
            .map((t) => t.text)
            .join('');
          const mainVerseText = verse.tokens.map((t) => t.text).join('');
          return (
            <View key={verse.id} style={styles.verseGroup}>
              <View style={styles.verseRow}>
                <Text style={[styles.verseNumber, mainActive]}>{index + 1}</Text>
                <Text style={[styles.verseText, mainActive]}>{mainVerseText}</Text>
              </View>
              {showGlossText ? (
                <Text style={[styles.glossText, glossActive ?? styles.glossTextDefault]}>
                  {glossVerseText}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 72,
    paddingBottom: 128,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  verses: { gap: 8 },
  verseGroup: { gap: 4 },
  verseRow: {
    flexDirection: 'row',
    gap: 8,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: '#111827',
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  glossText: {
    paddingLeft: 24,
    fontSize: 13,
    lineHeight: 20,
  },
  glossTextDefault: { color: '#4B5563' },
});
