import { Chord, PositionedChord, type ChordFunction } from './chord'
import { getTonality, type TonalityName } from './tonal'

export interface ChordProgression {
  tonality: TonalityName
  chords: ChordFunction[]
}

export interface PositionedChordProgression {
  tonality: TonalityName
  chords: PositionedChord[]
}

export namespace ChordProgression {
  export function toString(progression: ChordProgression): string {
    const tonality = getTonality(progression.tonality)
    let string = tonality.name + ':'
    for (const chord of progression.chords) {
      string += emsp + Chord.toString(chord, tonality)
    }

    return string
  }

  const emsp = '\u2003'
}

export namespace PositionedChordProgression {
  export function toString(progression: PositionedChordProgression): string {
    const tonality = getTonality(progression.tonality)
    let string = tonality.name + ':'
    for (const chord of progression.chords) {
      string += emsp + PositionedChord.toString(chord, tonality)
    }

    return string
  }

  const emsp = '\u2003'
}
