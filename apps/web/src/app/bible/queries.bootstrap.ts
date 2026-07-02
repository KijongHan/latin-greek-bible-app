import { setBibleQueries, setBibleAudioQueries } from "@bible-app/domain";
import { firebaseBibleQueries } from "./bible.queries";
import { firebaseBibleAudioQueries } from "./bibleaudio.queries";

setBibleQueries(firebaseBibleQueries);
setBibleAudioQueries(firebaseBibleAudioQueries);
