import { err } from '@/utils'
import type { RelativeNote, ScaleNote, Tonality } from './tonal'

export interface ChordFunction {
  root: ScaleNote
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
    tonality: Tonality,
    inversion: number,
  ): RelativeNote[] {
    return applyInversion(toRelativeNotesBeforeInversion(chord, tonality), inversion)
  }

  /**
   * @returns the notes of the chord, placed such that only the highest note is higher than
   * the highest note of the target chord.
   * The returned chord may be in any inversion.
   */
  export function placeAboveChord(
    chordFunction: ChordFunction,
    tonality: Tonality,
    targetChord: RelativeNote[],
  ): RelativeNote[] {
    const targetNote = getTopNote(targetChord)
    let chord = normalizeTopToOctaveBelow(placeCanonical(chordFunction, tonality, 0), targetNote)
    while (getTopNote(chord) <= targetNote) {
      chord = rotateChord(chord, 1)
    }
    return chord
  }

  /**
   * @returns the notes of the chord, placed such that only the lowest note is lower than
   * the lowest note of the target chord.
   * The returned chord may be in any inversion.
   */
  export function placeBelowChord(
    chordFunction: ChordFunction,
    tonality: Tonality,
    targetChord: RelativeNote[],
  ): RelativeNote[] {
    const targetNote = getBottomNote(targetChord)
    let adjustedChord = normalizeBassToOctaveAbove(
      placeCanonical(chordFunction, tonality, 0),
      targetNote,
    )
    while (Math.min(...adjustedChord) >= targetNote) {
      adjustedChord = rotateChord(adjustedChord, -1)
    }

    return adjustedChord
  }

  function toRelativeNotesBeforeInversion(
    chord: ChordFunction,
    tonality: Tonality,
  ): RelativeNote[] {
    return [
      tonality.getNote(chord.root),
      tonality.getNote(chord.root + 2),
      tonality.getNote(chord.root + 4),
    ]
  }

  function applyInversion(chordShape: RelativeNote[], inversion: number): RelativeNote[] {
    const octave = Math.floor(inversion / chordShape.length)
    const normalInversion = inversion % chordShape.length
    const inverted = []
    for (const [index, note] of chordShape.entries()) {
      const octaveForNote = octave + (index < normalInversion ? 1 : 0)
      inverted.push(note + 12 * octaveForNote)
    }
    return inverted
  }

  function rotateChord(chord: RelativeNote[], count: number): RelativeNote[] {
    const sortedChord = [...chord].sort((a, b) => a - b)

    const octave = Math.floor(count / sortedChord.length)
    const normalInversion = count % sortedChord.length
    const inverted = []
    for (const [index, note] of sortedChord.entries()) {
      const octaveForNote = octave + (index < normalInversion ? 1 : 0)
      inverted.push(note + 12 * octaveForNote)
    }
    return inverted
  }

  function changeChordOctave(chord: RelativeNote[], octaveShift: number): RelativeNote[] {
    return applyInversion(chord, chord.length * octaveShift)
  }

  function getTopNote(chord: RelativeNote[]): RelativeNote {
    return Math.max(...chord)
  }

  function getBottomNote(chord: RelativeNote[]): RelativeNote {
    return Math.min(...chord)
  }

  export function toString(chord: ChordFunction, tonality: Tonality): string {
    return toStringBeforeInversion(chord, tonality) + inversionToString(0)
  }

  function toStringBeforeInversion(chord: ChordFunction, tonality: Tonality): string {
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
    const notes = toRelativeNotesBeforeInversion(chord, tonality)

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

  function inversionToString(inversion: number): string {
    if (inversion === 0) {
      return ''
    }

    return '/' + (inversion * 2 + 1)
  }

  /**
   * @returns A copy of the chord shifted such that its bass note is in the
   * octave which has `target` as its lowest note.
   * The returned chord will be in the same inversion as the input chord.
   */
  function normalizeBassToOctaveAbove(
    chordShape: RelativeNote[],
    target: RelativeNote,
  ): RelativeNote[] {
    const bassNote = Math.min(...chordShape)
    const octaveAdjustment = Math.ceil((target - bassNote) / 12)
    return changeChordOctave(chordShape, octaveAdjustment)
  }

  /**
   * @returns A copy of the chord shifted such that its top note is in the
   * octave which has `target` as its highest note.
   * The returned chord will be in the same inversion as the input chord.
   */
  function normalizeTopToOctaveBelow(
    chordShape: RelativeNote[],
    target: RelativeNote,
  ): RelativeNote[] {
    const topNote = Math.max(...chordShape)
    const octaveAdjustment = Math.floor((target - topNote) / 12)
    return changeChordOctave(chordShape, octaveAdjustment)
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
