<script setup lang="ts">
import { reactive, ref } from 'vue'
import { randInt, sleep } from './utils'
import ProgressionView from './ProgressionView.vue'
import ChordCreator from './ChordCreator.vue'
import {
  Chord,
  ChordProgression,
  getTonality,
  PositionedChordProgression,
  Tonality,
  TonalityName,
  type ChordFunction,
  type PositionedChord,
} from './tonal'
import { MusicPlayer } from './musicPlayer'
import { buttonStyle } from './viewUtils'

let player: MusicPlayer
MusicPlayer.new().then((musicPlayer) => {
  player = musicPlayer
})

const selectedIndex = ref(0)

// TODO: Progression states should be stored in this component.
const progressions = reactive<ChordProgression[]>([newProgression()])
const progressionAnswer = ref('')

function selectProgression(index: number) {
  selectedIndex.value = index
}

function getSelectedProgression(): ChordProgression {
  return progressions[selectedIndex.value]!
}

function getSelectedTonality(): Tonality {
  return getTonality(getSelectedProgression().tonality)
}

function newProgression(): ChordProgression {
  return { tonality: TonalityName.Ionian, chords: [] }
}

function addProgression(): void {
  // TODO: Initialize new progression with the selected tonality.
  progressions.push(newProgression())
  selectedIndex.value = progressions.length - 1
}

function deleteProgression(): void {
  progressions.splice(selectedIndex.value, 1)
  if (progressions.length === 0) {
    progressions.push(newProgression())
  }

  if (selectedIndex.value >= progressions.length) {
    selectedIndex.value = progressions.length - 1
  }
}

async function quiz(): Promise<void> {
  progressionAnswer.value = ''

  const progressionOptions: ChordProgression[] = progressions.filter(
    (progression) => progression.chords.length > 0,
  )

  const progressionIndex = randInt(0, progressionOptions.length - 1)

  const progression = progressionOptions[progressionIndex]!
  const positionedChords = getChordsForProgression(progression)
  await player.playProgression(60, getTonality(progression.tonality), positionedChords)
  await sleep(500)
  progressionAnswer.value = PositionedChordProgression.toString({
    tonality: progression.tonality,
    chords: positionedChords,
  })
}

function getChordsForProgression(progression: ChordProgression): PositionedChord[] {
  const unalteredChords: PositionedChord[] = []
  const chords: PositionedChord[] = []

  const shouldAlter: boolean = randInt(0, 1) === 1
  const chordIdxToAlter = shouldAlter ? randInt(0, progression.chords.length - 1) : undefined
  const alteredChord =
    chordIdxToAlter !== undefined
      ? { root: (progression.chords[chordIdxToAlter]!.root + randInt(1, 7)) % 7 }
      : undefined

  for (const [idx, chordFunc] of progression.chords.entries()) {
    const originalChord = positionChord(chordFunc, unalteredChords[chords.length - 1])

    unalteredChords.push(originalChord)

    const chord =
      idx === chordIdxToAlter
        ? positionChord(alteredChord!, unalteredChords[chords.length - 1])
        : originalChord

    chords.push(chord)
  }

  return chords
}

function positionChord(
  chord: ChordFunction,
  lastChord: PositionedChord | undefined,
): PositionedChord {
  if (lastChord !== undefined) {
    if (randInt(0, 1) > 0) {
      return Chord.placeAboveChord(chord, lastChord)
    } else {
      return Chord.placeBelowChord(chord, lastChord)
    }
  } else {
    const inversion = randInt(0, 2)
    return { chord, position: inversion }
  }
}
</script>

<template>
  <div>
    <div>
      <button @click="addProgression()" :style="buttonStyle">Add Progression</button>
      <button @click="deleteProgression()" :style="buttonStyle">Delete Progression</button>
      <button @click="quiz()" :style="buttonStyle">Quiz</button>
    </div>
    <div>
      <div>{{ progressionAnswer }}</div>
    </div>
    <div>
      <ChordCreator
        :tonality="getSelectedTonality()"
        @selected="(root) => getSelectedProgression().chords.push({ root })"
        @remove-chord="getSelectedProgression().chords.pop()"
      />
    </div>
    <div v-for="(progression, index) in progressions">
      <div
        :class="['progression', { 'selected-progression': selectedIndex === index }]"
        @mousedown="selectProgression(index)"
      >
        <ProgressionView :chords="progression.chords" v-model="progression.tonality" />
      </div>
    </div>
  </div>
</template>

<style scoped>
div {
  color: white;
}

button {
  padding: 5px;
  margin: 1px;
  color: white;
  border-radius: 4px;
  font-size: 12pt;
}

.progression {
  display: inline-block;
  min-width: 360;
  border: 1px solid transparent;
  border-radius: 4px;
}

.selected-progression {
  display: inline-block;
  min-width: 360px;
  border: 1px solid white;
  border-radius: 4px;
}
</style>
