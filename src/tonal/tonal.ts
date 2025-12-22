import { err } from '../utils'

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
export type RelativeNote = number

// Represents a note in the MIDI numbering scheme.
// 60 is C4.
// Each increment represents one semitone.
export type AbsoluteNote = number

function noteFromScale(scale: Scale, number: ScaleNote): RelativeNote {
  const octave = Math.floor(number / scale.length)
  return 12 * octave + scale[number % scale.length]!
}
