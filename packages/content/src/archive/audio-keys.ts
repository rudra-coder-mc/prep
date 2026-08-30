/**
 * How a recording is addressed, borrowed from the web app rather than rewritten.
 *
 * The archive tells a device which recording belongs to which question and
 * which narration section, and a key it computed differently from the way the
 * cache stores them would be a key that downloads nothing. There is one
 * definition of that and it is the narration engine's, so this reaches for it.
 *
 * The same reach as the lesson components, for the same reason and with the same
 * cost. See ./web-sources.ts.
 */
export { scriptKey } from '../../../../apps/web/src/lib/speech/cache'
export {
  answerAudioKey,
  answerScript,
  questionAudioKey,
  questionScript,
} from '../../../../apps/web/src/lib/speech/spoken-question'
