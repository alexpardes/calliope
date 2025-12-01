<script setup lang="ts">
import { reactive, type Reactive } from 'vue'
import ChordCreator from './ChordCreator.vue'
import {
  Chord,
  ChordProgression,
  getTonality,
  Tonality,
  TonalityName,
  type ScaleNote,
} from './music'

const progression: Reactive<ScaleNote[]> = reactive([])

function getChords(): Chord[] {
  return progression.map((root) => new Chord(root))
}

function getProgression(): ChordProgression {
  return new ChordProgression(getCurrentTonalityName(), getChords())
}

defineExpose({
  getProgression,
})

function getCurrentTonalityName(): TonalityName {
  return TonalityName.Ionian
}

function getCurrentTonality(): Tonality {
  return getTonality(getCurrentTonalityName())
}

function addChord(root: ScaleNote): void {
  progression.push(root)
}

function removeChord(): void {
  progression.pop()
}
</script>

<template>
  <div class="chord-progression">
    <span class="chord-icon" v-for="chord in getChords()">
      {{ chord.toString(getCurrentTonality()) }}
    </span>
  </div>

  <ChordCreator @selected="(root) => addChord(root)" @remove-chord="removeChord()" />
</template>

<style scoped>
.chord-progression {
  margin: 10px 0px;
}

.chord-icon {
  color: white;
  background-color: teal;
  margin: 0px 5px;
  padding: 5px;
}
</style>
