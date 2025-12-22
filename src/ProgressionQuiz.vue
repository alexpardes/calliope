<script setup lang="ts">
import { reactive, ref, useTemplateRef, type Ref } from 'vue'
import { ChordProgression, getTonality, MusicPlayer, Tonality, TonalityName } from './music'
import { randInt, sleep } from './util'
import ProgressionEditor from './ProgressionEditor.vue'
import ChordCreator from './ChordCreator.vue'

let player: MusicPlayer
MusicPlayer.new().then((musicPlayer) => {
  player = musicPlayer
})

const selectedIndex = ref(0)

// TODO: Progression states should be stored in this component.
const progressions = reactive<object[]>([{}])
const progressionEditors = useTemplateRef('progressionEditors')

const progressionAnswer = ref('')

function getSelectedProgression(): InstanceType<typeof ProgressionEditor> | null {
  return progressionEditors.value !== null ? progressionEditors.value[selectedIndex.value]! : null
}

function selectProgression(index: number): void {
  selectedIndex.value = index
}

function getSelectedTonality(): Tonality {
  return getSelectedProgression()?.getCurrentTonality() || getTonality(TonalityName.Ionian)
}

function addProgression(): void {
  // TODO: Initialize new progression with the selected tonality.
  progressions.push({})
  selectedIndex.value = progressions.length - 1
}

function deleteProgression(): void {
  progressions.splice(selectedIndex.value, 1)
  if (progressions.length === 0) {
    progressions.push({})
  }

  if (selectedIndex.value >= progressions.length) {
    selectedIndex.value = progressions.length - 1
  }
}

async function quiz(): Promise<void> {
  progressionAnswer.value = ''

  const progressionOptions: ChordProgression[] = progressionEditors
    .value!.map((editor) => editor!.getProgression())
    .filter((progression) => progression.chords.length > 0)

  const progressionIndex = randInt(0, progressionOptions.length - 1)

  const progression = progressionOptions[progressionIndex]!
  await player.playProgression(progression)
  await sleep(1000)
  progressionAnswer.value = progression.toString()
}
</script>

<template>
  <div>
    <div v-for="(_progression, index) in progressions">
      <div
        :class="['progression', { 'selected-progression': selectedIndex === index }]"
        @mousedown="selectProgression(index)"
      >
        <ProgressionEditor ref="progressionEditors" />
      </div>
    </div>
  </div>
  <div>
    <ChordCreator
      :tonality="getSelectedTonality()"
      @selected="(root) => getSelectedProgression()!.addChord(root)"
      @remove-chord="getSelectedProgression()!.removeChord()"
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
