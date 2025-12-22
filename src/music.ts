import * as Soundfont from 'soundfont-player'
import { err, randInt, sleep } from './util'

const decimalToRoman: Map<number, string> = new Map([
  [1, 'I'],
  [2, 'II'],
  [3, 'III'],
  [4, 'IV'],
  [5, 'V'],
  [6, 'VI'],
  [7, 'VII'],
])

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

    let lastChord: RelativeNote[] | undefined
    for (const chord of progression.chords) {
      if (this.activeProgressionToken !== token) {
        return
      }

      let notes = chord.toOffsets(getTonality(progression.tonality))
      if (lastChord !== undefined) {
        if (randInt(0, 1) > 0) {
          notes = moveChordTopAbove(notes, Math.max(...lastChord))
        } else {
          notes = moveChordBassBelow(notes, Math.min(...lastChord))
        }
      } else {
        const inversion = randInt(-2, 2)
        notes = applyInversion(notes, inversion)
      }

      lastChord = notes

      await this.playChordFromOffsets(60, notes)
      await sleep(750)
    }
  }

  async playChord(tonality: Tonality, chord: Chord): Promise<void> {
    await this.playChordFromOffsets(60, chord.toOffsets(tonality))
  }

  private async playChordFromOffsets(root: AbsoluteNote, offsets: RelativeNote[]): Promise<void> {
    this.instrument.stop()
    const sorted = [...offsets]
    sorted.sort((a, b) => a - b)
    for (const offset of sorted) {
      this.instrument.play((root + offset).toString())
    }
  }
}

export enum TonalityName {
  Ionian = 0,
  Dorian = 1,
  Phrygian = 2,
  Lydian = 3,
  Mixolydian = 4,
  Aeolian = 5,
  Locrian = 6,
  HarmonicMinor,
}

export class Tonality {
  public constructor(
    public readonly name: string,
    private readonly scale: Scale,
  ) {}

  public getNote(note: ScaleNote): RelativeNote {
    const octave = Math.floor(note / this.scale.length)
    return 12 * octave + this.scale[note % this.scale.length]!
  }
}

type Scale = RelativeNote[]

const harmonicMinorScale: Scale = [0, 2, 3, 5, 7, 8, 11]
const diatonicOffsets = [0, 2, 4, 5, 7, 9, 11]

const tonalities: Map<TonalityName, Tonality> = new Map([
  [TonalityName.Ionian, new Tonality('Major', getModalScale(0))],
  [TonalityName.Dorian, new Tonality('Dorian', getModalScale(1))],
  [TonalityName.Phrygian, new Tonality('Phrygian', getModalScale(2))],
  [TonalityName.Lydian, new Tonality('Lydian', getModalScale(3))],
  [TonalityName.Mixolydian, new Tonality('Mixolydian', getModalScale(4))],
  [TonalityName.Aeolian, new Tonality('Nat. Minor', getModalScale(5))],
  [TonalityName.Locrian, new Tonality('Locrian', getModalScale(6))],
  [TonalityName.HarmonicMinor, new Tonality('Harm. Minor', harmonicMinorScale)],
])

export function getTonality(tonality: TonalityName): Tonality {
  return tonalities.get(tonality) ?? err('Tonality not defined')
}

function getModalScale(modeNumber: number): Scale {
  const scale = []
  const offset = noteFromScale(diatonicOffsets, modeNumber)
  while (scale.length < 7) {
    scale.push(noteFromScale(diatonicOffsets, scale.length + modeNumber) - offset)
  }
  return scale
}

// Represents the nth note (zero indexed) in a given scale.
export type ScaleNote = number

// Represents a note n semitones from a given root.
type RelativeNote = number

// Represents a note in the MIDI numbering scheme.
// 60 is C4.
// Each increment represents one semitone.
type AbsoluteNote = number

const emsp = '\u2003'

export class ChordProgression {
  public constructor(
    public tonality: TonalityName,
    public chords: Chord[],
  ) {}

  public toString(): string {
    const tonality = getTonality(this.tonality)
    let string = tonality.name + ':'
    for (const chord of this.chords) {
      string += emsp + chord.toString(tonality)
    }

    return string
  }
}

enum ChordQuality {
  Maj,
  Min,
  Aug,
  Dim,
}

export class Chord {
  public constructor(
    // Chord number is 0-based index.
    public readonly rootIndex: ScaleNote,
    public readonly inversion?: number,
  ) {}

  public toOffsets(tonality: Tonality): RelativeNote[] {
    return applyInversion(this.toRelativeNotesBeforeInversion(tonality), this.inversion ?? 0)
  }

  public toString(tonality: Tonality): string {
    return this.toStringBeforeInversion(tonality) + this.inversionToString()
  }

  private toStringBeforeInversion(tonality: Tonality): string {
    const romanNumerals =
      decimalToRoman.get(this.rootIndex + 1) ?? err('No notation found for chord root')

    switch (this.getQuality(tonality)) {
      case ChordQuality.Maj:
        return romanNumerals.toUpperCase()
      case ChordQuality.Min:
        return romanNumerals.toLowerCase()
      case ChordQuality.Dim:
        return romanNumerals.toLowerCase() + '⁰'
      case ChordQuality.Aug:
        return romanNumerals.toUpperCase() + '⁺'
    }
  }

  private toRelativeNotesBeforeInversion(tonality: Tonality): RelativeNote[] {
    return [
      tonality.getNote(this.rootIndex),
      tonality.getNote(this.rootIndex + 2),
      tonality.getNote(this.rootIndex + 4),
    ]
  }

  private getQuality(tonality: Tonality): ChordQuality {
    const notes = this.toRelativeNotesBeforeInversion(tonality)

    const thirdInterval = notes[1]! - notes[0]!
    const fifthInterval = notes[2]! - notes[0]!
    switch (thirdInterval) {
      case 3: {
        switch (fifthInterval) {
          case 6:
            return ChordQuality.Dim
          case 7:
            return ChordQuality.Min
          default:
            err('Unknown chord shape: 0, ' + thirdInterval + ', ' + fifthInterval)
        }
      }
      case 4: {
        switch (fifthInterval) {
          case 7:
            return ChordQuality.Maj
          case 8:
            return ChordQuality.Aug
          default:
            err('Unknown chord shape: 0, ' + thirdInterval + ', ' + fifthInterval)
        }
      }
      default:
        err('Unknown chord shape: 0, ' + thirdInterval + ', ' + fifthInterval)
    }
  }

  private inversionToString(): string {
    const inversion = (this.inversion ?? 0) % 3
    if (inversion === 0) {
      return ''
    }

    return '/' + (inversion * 2 + 1)
  }
}

function noteFromScale(scale: Scale, number: ScaleNote): RelativeNote {
  const octave = Math.floor(number / scale.length)
  return 12 * octave + scale[number % scale.length]!
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

/**
 * @returns an adjusted copy of the chord,
 * shifted such only its highest note is higher than the target note.
 * The adjusted chord may be in a different inversion than the input chord.
 */
function moveChordTopAbove(chord: RelativeNote[], target: RelativeNote): RelativeNote[] {
  let adjustedChord = normalizeTopToOctaveBelow(chord, target)
  while (Math.max(...adjustedChord) <= target) {
    adjustedChord = rotateChord(adjustedChord, 1)
  }
  return adjustedChord
}

/**
 * @returns an adjusted copy of the chord,
 * shifted such only its bass note is lower than the target note.
 * The adjusted chord may be in a different inversion than the input chord.
 */
function moveChordBassBelow(chord: RelativeNote[], target: RelativeNote): RelativeNote[] {
  let adjustedChord = normalizeBassToOctaveAbove(chord, target)
  while (Math.min(...adjustedChord) >= target) {
    adjustedChord = rotateChord(adjustedChord, -1)
  }

  return adjustedChord
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
