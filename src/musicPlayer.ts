import * as Soundfont from 'soundfont-player'
import {
  Chord,
  ChordProgression,
  getTonality,
  Tonality,
  type AbsoluteNote,
  type ChordFunction,
  type RelativeNote,
} from './tonal'
import { randInt, sleep } from './utils'

export class MusicPlayer {
  private activeProgressionToken: object | undefined

  private constructor(private readonly instrument: Soundfont.Player) {}

  public static async new(): Promise<MusicPlayer> {
    const instrument = await Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano')
    return new MusicPlayer(instrument)
  }

  async playProgression(progression: ChordProgression): Promise<void> {
    this.instrument.stop()
    const token = {}
    this.activeProgressionToken = token
    const tonality = getTonality(progression.tonality)

    let lastChord: RelativeNote[] | undefined
    for (const chordFunction of progression.chords) {
      if (this.activeProgressionToken !== token) {
        return
      }

      lastChord = positionChord(chordFunction, tonality, lastChord)
      await this.playRelativeChord(60, lastChord)
      await sleep(750)
    }
  }

  private async playRelativeChord(root: AbsoluteNote, offsets: RelativeNote[]): Promise<void> {
    this.instrument.stop()
    const sorted = [...offsets]
    sorted.sort((a, b) => a - b)
    for (const offset of sorted) {
      this.instrument.play((root + offset).toString())
    }
  }
}

function positionChord(
  chord: ChordFunction,
  tonality: Tonality,
  lastChord: RelativeNote[] | undefined,
): RelativeNote[] {
  if (lastChord !== undefined) {
    if (randInt(0, 1) > 0) {
      return Chord.placeAboveChord(chord, tonality, lastChord)
    } else {
      return Chord.placeBelowChord(chord, tonality, lastChord)
    }
  } else {
    const inversion = randInt(0, 2)
    return Chord.placeCanonical(chord, tonality, inversion)
  }
}
