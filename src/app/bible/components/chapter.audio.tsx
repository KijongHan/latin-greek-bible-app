import { useEffect } from "react";
import { useBibleStore } from "../bible.store";
import { useBibleAudioStore } from "../bibleaudio.store";

export default function ChapterAudio({ className }: { className?: string }) {
  const {
    englishChapterAudio,
    ancientChapterAudio,
    loadChapterAudioForBibles,
  } = useBibleAudioStore();
  const { englishSource, ancientSource } = useBibleStore();

  return (
    <div className={className}>
      <audio controls></audio>
    </div>
  );
}
