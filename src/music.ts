import * as Soundfont from 'soundfont-player'
import { err, sleep } from './util'

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
      await this.playChord(getTonality(progression.tonality), chord)
      await sleep(750)
    }
  }

  async playChord(tonality: Tonality, chord: Chord) {
    await this.playChordFromOffsets(60, chord.toOffsets(tonality))
  }

  private async playChordFromOffsets(root: AbsoluteNote, offsets: RelativeNote[]) {
    this.instrument.stop()
    const sorted = [...offsets]
    sorted.sort((a, b) => a - b)
    for (const offset of sorted) {
      this.instrument.play(root + offset)
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

function noteFromScale(scale: Scale, number: ScaleNote) {
  const octave = Math.floor(number / scale.length)
  return 12 * octave + scale[number % scale.length]!
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
