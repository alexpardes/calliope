import * as Soundfont from 'soundfont-player'
import {
  Chord,
  getTonality,
  PositionedChordProgression,
  type AbsoluteNote,
  type VoicedProgression,
} from './tonal'
import { sleep } from './utils'

export class MusicPlayer {
  private activeProgressionToken: object | undefined

  private constructor(private readonly instrument: Soundfont.Player) {}

  public static async new(): Promise<MusicPlayer> {
    const instrument = await Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano')
    return new MusicPlayer(instrument)
  }

  public async playVoicedProgression(
    progression: VoicedProgression,
    rootNote: AbsoluteNote,
  ): Promise<void> {
    await this.playPositionedProgression(
      PositionedChordProgression.fromVoicedProgression(progression),
      rootNote,
    )
  }

  public async playPositionedProgression(
    progression: PositionedChordProgression,
    rootNote: AbsoluteNote,
  ): Promise<void> {
    const tonality = getTonality(progression.tonality)
    await this.playChords(
      progression.chords.map((chord) => Chord.getNotes(rootNote, tonality, chord)),
    )
  }

  private async playChords(chords: AbsoluteNote[][]): Promise<void> {
    this.instrument.stop()
    const token = {}
    this.activeProgressionToken = token

    for (const chord of chords) {
      if (this.activeProgressionToken !== token) {
        return
      }

      this.playChord(chord)
      await sleep(900)
    }
  }

  private playChord(chord: AbsoluteNote[]): void {
    this.instrument.stop()
    for (const note of chord) {
      this.instrument.play(note.toString())
    }
  }
}
