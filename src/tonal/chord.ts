import { boolToInt, err, posmod } from '@/utils'
import type { AbsoluteNote, RelativeNote, ScaleDegree, Tonality } from './tonal'
import { ChordMovement } from './chordProgression'

export interface ChordFunction {
  root: ScaleDegree
}

export namespace Chord {
  enum Quality {
    Maj,
    Min,
    Aug,
    Dim,
  }

  export function placeCanonical(
    chord: ChordFunction,
    root: AbsoluteNote,
    tonality: Tonality,
    inversion: number,
  ): AbsoluteNote[] {
    return applyInversion(toNotesBeforeInversion(chord, root, tonality), inversion)
  }

  export function placeChordWithMovement(
    chord: ChordFunction,
    prevChord: PositionedChord,
    movement: ChordMovement,
  ): PositionedChord {
    switch (movement) {
      case ChordMovement.Up:
        return placeAboveChord(chord, prevChord)
      case ChordMovement.Down:
        return placeBelowChord(chord, prevChord)
    }
  }

  /**
   * @returns the chord positioned such that only the highest note is higher than
   * the highest note of the target chord.
   * The returned chord may be in any inversion.
   */
  export function placeAboveChord(
    chord: ChordFunction,
    targetChord: PositionedChord,
  ): PositionedChord {
    const targetNote = getTopNote(targetChord)
    let inversion = 0
    let smallestInterval = 7

    // We find the note in the chord which can be placed the smallest interval above the target note.
    // The chord should be inverted to make that the top note.
    for (let noteIdx = 0; noteIdx < 3; noteIdx++) {
      const note = chord.root + 2 * noteIdx
      const interval = posmod(note - targetNote, 7)
      if (interval < smallestInterval) {
        inversion = posmod(noteIdx + 1, 3)
        smallestInterval = interval
      }
    }

    const topNoteIdx = posmod(2 + inversion, 3)
    const topNote = chord.root + 2 * topNoteIdx
    const octave = Math.ceil((targetNote - topNote) / 7) - boolToInt(inversion > 0)
    return { chord, position: 3 * octave + inversion }
  }

  /**
   * @returns the chord positioned such that only the lowest note is lower than
   * the lowest note of the target chord.
   * The returned chord may be in any inversion.
   */
  export function placeBelowChord(
    chord: ChordFunction,
    targetChord: PositionedChord,
  ): PositionedChord {
    const targetNote = getBottomNote(targetChord)
    let inversion = 0
    let smallestInterval = 7

    // We find the note in the chord which can be placed the smallest interval below the target note.
    // The chord should be inverted to make that the bottom note.
    for (let noteIdx = 0; noteIdx < 3; noteIdx++) {
      const note = chord.root + 2 * noteIdx
      const interval = posmod(targetNote - note, 7)
      if (interval < smallestInterval) {
        inversion = noteIdx
        smallestInterval = interval
      }
    }

    const bottomNoteIdx = inversion
    const bottomNote = chord.root + 2 * bottomNoteIdx
    const octave = Math.floor((targetNote - bottomNote) / 7)
    return { chord, position: 3 * octave + inversion }
  }

  export function getNotes(
    root: AbsoluteNote,
    tonality: Tonality,
    chord: PositionedChord,
  ): AbsoluteNote[] {
    return applyInversion(toNotesBeforeInversion(chord.chord, root, tonality), chord.position)
  }

  function toNotesBeforeInversion(
    chord: ChordFunction,
    root: AbsoluteNote,
    tonality: Tonality,
  ): AbsoluteNote[] {
    return [
      root + tonality.getNote(chord.root),
      root + tonality.getNote(chord.root + 2),
      root + tonality.getNote(chord.root + 4),
    ]
  }

  function applyInversion(chordShape: RelativeNote[], inversion: number): RelativeNote[] {
    const octave = Math.floor(inversion / chordShape.length)
    const normalInversion = posmod(inversion, chordShape.length)
    const inverted = []
    for (const [index, note] of chordShape.entries()) {
      const octaveForNote = octave + (index < normalInversion ? 1 : 0)
      inverted.push(note + 12 * octaveForNote)
    }
    return inverted
  }

  function getTopNote(chord: PositionedChord): ScaleDegree {
    const inversion = inversionFromPosition(chord)
    const topNoteIndex = (2 + inversion) % 3
    const note: ScaleDegree = chord.chord.root + 2 * topNoteIndex
    const octave = octaveFromPosition(chord) + boolToInt(inversion > 0)
    return 7 * octave + note
  }

  function getBottomNote(chord: PositionedChord): ScaleDegree {
    const note: ScaleDegree = chord.chord.root + 2 * inversionFromPosition(chord)
    const octave = octaveFromPosition(chord)
    return 7 * octave + note
  }

  function inversionFromPosition(chord: PositionedChord): number {
    // TODO: This assumes that the chord is a triad.
    return posmod(chord.position, 3)
  }

  function octaveFromPosition(chord: PositionedChord): number {
    // TODO: This assumes that the chord is a triad.
    return Math.floor(chord.position / 3)
  }

  export function toString(chord: ChordFunction, tonality: Tonality): string {
    const romanNumerals =
      decimalToRoman.get(chord.root + 1) ?? err('No notation found for chord root')

    switch (getQuality(chord, tonality)) {
      case Quality.Maj:
        return romanNumerals.toUpperCase()
      case Quality.Min:
        return romanNumerals.toLowerCase()
      case Quality.Dim:
        return romanNumerals.toLowerCase() + '⁰'
      case Quality.Aug:
        return romanNumerals.toUpperCase() + '⁺'
    }
  }

  function getQuality(chord: ChordFunction, tonality: Tonality): Quality {
    const notes = toNotesBeforeInversion(chord, 0, tonality)

    const thirdInterval = notes[1]! - notes[0]!
    const fifthInterval = notes[2]! - notes[0]!
    switch (thirdInterval) {
      case 3: {
        switch (fifthInterval) {
          case 6:
            return Quality.Dim
          case 7:
            return Quality.Min
          default:
            err('Unknown chord shape: 0, ' + thirdInterval + ', ' + fifthInterval)
        }
      }
      case 4: {
        switch (fifthInterval) {
          case 7:
            return Quality.Maj
          case 8:
            return Quality.Aug
          default:
            err('Unknown chord shape: 0, ' + thirdInterval + ', ' + fifthInterval)
        }
      }
      default:
        err('Unknown chord shape: 0, ' + thirdInterval + ', ' + fifthInterval)
    }
  }

  const decimalToRoman: Map<number, string> = new Map([
    [1, 'I'],
    [2, 'II'],
    [3, 'III'],
    [4, 'IV'],
    [5, 'V'],
    [6, 'VI'],
    [7, 'VII'],
  ])
}

export interface PositionedChord {
  chord: ChordFunction

  /**
   * This is the number of inversions from the canonical position.
   */
  position: ChordPosition
}

export type ChordPosition = number

export namespace PositionedChord {
  export function toString(chord: PositionedChord, tonality: Tonality): string {
    return Chord.toString(chord.chord, tonality) + inversionToString(posmod(chord.position, 3))
  }

  function inversionToString(inversion: number): string {
    if (inversion === 0) {
      return ''
    }

    return '/' + (inversion * 2 + 1)
  }
}
