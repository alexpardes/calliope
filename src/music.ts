import * as Soundfont from 'soundfont-player'
import { assert, err, sleep } from './util'

export class MusicPlayer {
  private activeProgressionToken: object | undefined

  private constructor(private readonly instrument: any) {}

  public static async new(): Promise<MusicPlayer> {
    const instrument = await Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano')
    return new MusicPlayer(instrument)
  }

  async playProgression(progression: ChordProgression) {
    this.instrument.stop()
    const token = {}
    this.activeProgressionToken = token
    for (const chord of progression.chords) {
      if (this.activeProgressionToken !== token) {
        return
      }
      await this.playChord(tonalityFromName(progression.tonality), chord)
      await sleep(750)
    }
  }

  async playChord(tonality: Tonality, chord: Chord) {
    await this.playChordFromOffsets(60, chord.toOffsets(tonality))
  }

  private async playChordFromOffsets(root: number, offsets: number[]) {
    this.instrument.stop()
    const sorted = [...offsets]
    sorted.sort((a, b) => a - b)
    for (const offset of sorted) {
      this.instrument.play(root + offset)
    }
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

type Tonality = RelativeNote[]

const tonalityToName: Map<TonalityName, string> = new Map([
  [TonalityName.Ionian, 'Major'],
  [TonalityName.Dorian, 'Dorian'],
  [TonalityName.Phrygian, 'Phrygian'],
  [TonalityName.Lydian, 'Lydian'],
  [TonalityName.Mixolydian, 'Mixolydian'],
  [TonalityName.Aeolian, 'Nat. Minor'],
  [TonalityName.Locrian, 'Locrian'],
  [TonalityName.HarmonicMinor, 'Harm. Minor'],
])

function tonalityToString(tonality: TonalityName): string {
  return tonalityToName.get(tonality) ?? err('Unknown tonality')
}

const diatonicOffsets = [0, 2, 4, 5, 7, 9, 11]

function getModalScale(modeNumber: number): Tonality {
  const scale = []
  const offset = noteFromTonality(diatonicOffsets, modeNumber)
  while (scale.length < 7) {
    scale.push(noteFromTonality(diatonicOffsets, scale.length + modeNumber) - offset)
  }
  return scale
}

const harmonicMinorScale: Tonality = [0, 2, 3, 5, 7, 8, 11]

function tonalityFromName(tonality: TonalityName): Tonality {
  if (tonality <= 6) {
    return getModalScale(tonality)
  }

  switch (tonality) {
    case TonalityName.Ionian:
    case TonalityName.Dorian:
    case TonalityName.Phrygian:
    case TonalityName.Lydian:
    case TonalityName.Mixolydian:
    case TonalityName.Aeolian:
    case TonalityName.Locrian:
      return getModalScale(tonality)

    case TonalityName.HarmonicMinor:
      return harmonicMinorScale
  }
}

// Represents the nth note in a given scale.
type ScaleNote = number

// Represents a note n semitones from a given root.
type RelativeNote = number

const emsp = '\u2003'

export class ChordProgression {
  public constructor(
    public tonality: TonalityName,
    public chords: Chord[],
  ) {}

  public toString(): string {
    let string = tonalityToString(this.tonality) + ':'
    for (const chord of this.chords) {
      string += emsp + chord.toString(tonalityFromName(this.tonality))
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

  private toStringBeforeInversion(tonality: Tonality) {
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
      noteFromTonality(tonality, this.rootIndex),
      noteFromTonality(tonality, this.rootIndex + 2),
      noteFromTonality(tonality, this.rootIndex + 4),
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

// Number is a 0-based index.
function noteFromTonality(tonality: Tonality, number: number) {
  const octave = Math.floor(number / tonality.length)
  return 12 * octave + tonality[number % tonality.length]!
}

function applyInversion(chordShape: RelativeNote[], inversion: number) {
  const octave = Math.floor(inversion / chordShape.length)
  const normalInversion = inversion % chordShape.length
  const inverted = []
  for (const [index, note] of chordShape.entries()) {
    const octaveForNote = octave + (index < normalInversion ? 1 : 0)
    inverted.push(note + 12 * octaveForNote)
  }
  return inverted
}

function changeChordOctave(chord: RelativeNote[], octaveShift: number) {
  return applyInversion(chord, chord.length * octaveShift)
}

function normalizeBassToOctave(chordShape: RelativeNote[], octaveRoot: RelativeNote) {
  const bassNote = Math.min(...chordShape)
  const octaveAdjustment = -Math.floor((bassNote - octaveRoot) / 12)
  return changeChordOctave(chordShape, octaveAdjustment)
}
