<script setup lang="ts">
import { reactive, ref } from 'vue'
import { randInt, sleep } from './utils'
import ProgressionView from './ProgressionView.vue'
import ChordCreator from './ChordCreator.vue'
import { ChordProgression, getTonality, Tonality, TonalityName } from './tonal'
import { MusicPlayer } from './musicPlayer'

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
  await player.playProgression(progression)
  await sleep(1000)
  progressionAnswer.value = ChordProgression.toString(progression)
}
</script>

<template>
  <div>
    <div v-for="(progression, index) in progressions">
      <div
        :class="['progression', { 'selected-progression': selectedIndex === index }]"
        @mousedown="selectProgression(index)"
      >
        <ProgressionView :chords="progression.chords" v-model="progression.tonality" />
      </div>
    </div>
  </div>
  <div>
    <ChordCreator
      :tonality="getSelectedTonality()"
      @selected="(root) => getSelectedProgression().chords.push({ root })"
      @remove-chord="getSelectedProgression().chords.pop()"
    />
  </div>
  <div>
    <button @click="addProgression()">Add Progression</button>
    <button @click="deleteProgression()">Delete Progression</button>
    <button @click="quiz()">Quiz</button>
  </div>
  <div>
    <div>{{ progressionAnswer }}</div>
  </div>
</template>

<style scoped>
div {
  color: white;
}

.progression {
  display: inline-block;
  min-width: 375px;
}

.selected-progression {
  display: inline-block;
  min-width: 375px;
  background-color: white;
}
</style>
