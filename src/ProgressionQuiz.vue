<script setup lang="ts">
import { reactive, ref } from 'vue'
import { randInt, sleep } from './utils'
import ProgressionView from './ProgressionView.vue'
import ChordCreator from './ChordCreator.vue'
import {
  Chord,
  ChordProgression,
  getTonality,
  Tonality,
  TonalityName,
  type AbsoluteNote,
  type ChordFunction,
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
  await player.playChords(getChordsForProgression(progression))
  await sleep(1000)
  progressionAnswer.value = ChordProgression.toString(progression)
}

function getChordsForProgression(progression: ChordProgression): AbsoluteNote[][] {
  const rootNote: AbsoluteNote = 60
  const tonality = getTonality(progression.tonality)
  const chords: AbsoluteNote[][] = []
  for (const chordFunc of progression.chords) {
    chords.push(positionChord(chordFunc, rootNote, tonality, chords[chords.length - 1]))
  }

  return chords
}

function positionChord(
  chord: ChordFunction,
  root: AbsoluteNote,
  tonality: Tonality,
  lastChord: AbsoluteNote[] | undefined,
): AbsoluteNote[] {
  if (lastChord !== undefined) {
    if (randInt(0, 1) > 0) {
      return Chord.placeAboveChord(chord, root, tonality, lastChord)
    } else {
      return Chord.placeBelowChord(chord, root, tonality, lastChord)
    }
  } else {
    const inversion = randInt(0, 2)
    return Chord.placeCanonical(chord, root, tonality, inversion)
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
