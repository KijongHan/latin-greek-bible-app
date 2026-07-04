import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBibleStore, type BiblePreset, type Session } from '@bible-app/domain';

import { Select } from '@/components/shared/select';
import { bookIdLookup, booksWithAudio, bookTestamentLookup } from '@/constants/bible.data';

const getDateAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const getBookColor = (book: string) => {
  const testament = bookTestamentLookup.get(book);
  if (testament === 'New Testament') return '#FECACA';
  if (testament === 'Old Testament') return '#7DD3FC';
  if (testament === 'Deuterocanonical') return '#DDD6FE';
  return '#D1D5DB';
};

export function FrontPage() {
  const [preset, setPreset] = useState<BiblePreset | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const {
    currentSession,
    sharedBooks,
    presets,
    mainSource,
    glossSource,
    bibles,
    setBook,
    setChapter,
    setMainBible,
    setGlossBible,
    lastSessions,
  } = useBibleStore();

  useEffect(() => {
    setPreset(
      presets.find(
        (p) =>
          p.mainBibleId === mainSource?.bible?.id &&
          p.glossBibleId === glossSource?.bible?.id
      )
    );
  }, [mainSource, glossSource, presets]);

  useEffect(() => {
    if (currentSession && currentSession.visits.length > 0) {
      setSessions([currentSession, ...lastSessions]);
    } else {
      setSessions(lastSessions);
    }
  }, [lastSessions, currentSession]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Bible</Text>
        <View>
          <Text style={styles.mainName}>{mainSource?.bible?.name ?? 'Bible'}</Text>
          {glossSource?.bible?.name ? (
            <Text style={styles.glossName}>
              with <Text style={styles.glossNameBold}>{glossSource.bible.name}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Continue Last Session</Text>
          <View style={{ gap: 8 }}>
            {sessions
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.sessionDate).getTime() -
                  new Date(a.sessionDate).getTime()
              )
              .map((session) => {
                const lastVisit = session.visits.at(-1);
                const bookId = lastVisit?.main.bookId ?? '';
                const chapterId = lastVisit?.main.chapterId ?? '';
                return (
                  <Pressable
                    key={session.sessionId}
                    onPress={async () => {
                      setMainBible(lastVisit?.main.bibleId ?? '');
                      setGlossBible(lastVisit?.gloss.bibleId ?? '');
                      await setBook(bookId);
                      await setChapter(chapterId);
                    }}
                    style={[styles.pill, { backgroundColor: getBookColor(bookId) }]}
                  >
                    <View>
                      <Text style={styles.pillTitle}>
                        {bookIdLookup.get(bookId)} {chapterId.split('.')[1]}
                      </Text>
                      <Text style={styles.pillSubtitle}>
                        {getDateAgo(session.sessionDate)}
                      </Text>
                    </View>
                    <View style={styles.pillMeta}>
                      <Text style={styles.pillMetaText}>{lastVisit?.main.bibleName}</Text>
                      <Text style={styles.pillMetaText}>{lastVisit?.gloss.bibleName}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Main/Gloss Presets</Text>
        <Select
          items={presets}
          selectedId={preset?.name ?? 'Custom'}
          idSelector={(p) => p.name}
          nameSelector={(p) => p.name}
          hideId="Custom"
          onSelect={(p) => {
            if (p.name !== 'Custom') {
              setMainBible(p.mainBibleId);
              setGlossBible(p.glossBibleId);
            }
          }}
        />
      </View>

      <View style={styles.selectRow}>
        <View style={styles.selectCol}>
          <Text style={styles.sectionLabel}>Main Text</Text>
          <Select
            items={bibles}
            selectedId={mainSource?.bible?.id}
            idSelector={(b) => b.id}
            nameSelector={(b) => b.name}
            onSelect={(b) => setMainBible(b.id)}
          />
        </View>
        <View style={styles.selectCol}>
          <Text style={styles.sectionLabel}>Gloss Text</Text>
          <Select
            items={bibles}
            selectedId={glossSource?.bible?.id}
            idSelector={(b) => b.id}
            nameSelector={(b) => b.name}
            onSelect={(b) => setGlossBible(b.id)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Audio Books</Text>
        <View style={styles.grid}>
          {sharedBooks
            .filter((book) => booksWithAudio.includes(book))
            .map((book) => (
              <Pressable
                key={book}
                onPress={() => setBook(book)}
                style={[styles.bookPill, { backgroundColor: getBookColor(book) }]}
              >
                <Text style={styles.bookPillText}>{bookIdLookup.get(book)}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Books</Text>
        <View style={styles.grid}>
          {sharedBooks.map((book) => (
            <Pressable
              key={book}
              onPress={() => setBook(book)}
              style={[styles.bookPill, { backgroundColor: getBookColor(book) }]}
            >
              <Text style={styles.bookPillText}>{bookIdLookup.get(book)}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHeading}>About This Project</Text>
        <Text style={styles.footerText}>
          This project is a work in progress. The focus is on the study of ancient
          Latin, Greek, Hebrew and Aramaic texts and making them easily accessible
          alongside contemporary english translations.
        </Text>
        <Text style={styles.footerText}>
          Bible uses free and open source data for bible texts and translations. The
          data is sourced from the awesome work done by the Github community in the{' '}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL('https://github.com/scrollmapper/bible_databases')
            }
          >
            Open Source Bible Databases
          </Text>{' '}
          project.
        </Text>
        <Text style={styles.footerText}>
          Audio is generated by TTS from OpenAI&apos;s{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://openai.com/')}
          >
            Whisper
          </Text>{' '}
          model.
        </Text>
        <Text style={styles.footerHeading}>Contact</Text>
        <Text style={styles.footerText}>
          If you have any questions or feedback, please contact me at{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:thomas.kijong.han@gmail.com')}
          >
            thomas.kijong.han@gmail.com
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  heroTitle: { fontSize: 48, fontWeight: '700', textAlign: 'center' },
  mainName: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  glossName: { color: '#6B7280', textAlign: 'center' },
  glossNameBold: { fontWeight: '600', color: '#6B7280' },
  section: { gap: 8 },
  sectionLabel: {
    paddingHorizontal: 8,
    color: '#6B7280',
    fontSize: 15,
  },
  selectRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectCol: { flex: 1, gap: 8 },
  pill: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  pillTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  pillSubtitle: { fontSize: 12, color: '#4B5563' },
  pillMeta: { alignItems: 'flex-end' },
  pillMetaText: { fontSize: 12, color: '#6B7280' },
  chevron: { fontSize: 20, color: '#4B5563' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookPill: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: '48%',
    flexGrow: 1,
  },
  bookPillText: { fontSize: 14, color: '#374151' },
  footer: {
    gap: 8,
    marginTop: 8,
  },
  footerHeading: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
  },
  link: { color: '#2563EB', textDecorationLine: 'underline' },
});
