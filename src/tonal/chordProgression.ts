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

export interface VoicedProgression {
  readonly progression: ChordProgression
  readonly voicing: ProgressionVoicing
}

export interface ProgressionVoicing {
  readonly firstChordPosition: number
  readonly chordMovements: ChordMovement[]
}

export enum ChordMovement {
  Up = 1,
  Down = -1,
}

const emsp = '\u2003'

export namespace ChordProgression {
  export function toString(progression: ChordProgression): string {
    const tonality = getTonality(progression.tonality)
    let string = tonality.name + ':'
    for (const chord of progression.chords) {
      string += emsp + Chord.toString(chord, tonality)
    }

    return string
  }

  export function oppositeMovement(movement: ChordMovement): ChordMovement {
    switch (movement) {
      case ChordMovement.Up:
        return ChordMovement.Down
      case ChordMovement.Down:
        return ChordMovement.Up
    }
  }
}

export namespace PositionedChordProgression {
  export function fromVoicedProgression(
    progression: VoicedProgression,
  ): PositionedChordProgression {
    const positionedChords: PositionedChord[] = []
    for (let chordIdx = 0; chordIdx < progression.progression.chords.length; chordIdx++) {
      const chord = progression.progression.chords[chordIdx]!
      if (chordIdx === 0) {
        positionedChords.push({ chord, position: progression.voicing.firstChordPosition })
      } else {
        positionedChords.push(
          Chord.placeChordWithMovement(
            chord,
            positionedChords[positionedChords.length - 1]!,
            progression.voicing.chordMovements[chordIdx - 1]!,
          ),
        )
      }
    }

    return { tonality: progression.progression.tonality, chords: positionedChords }
  }

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
