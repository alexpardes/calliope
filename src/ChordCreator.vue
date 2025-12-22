<script setup lang="ts">
import { Chord, type ScaleNote, Tonality } from './tonal'

const props = defineProps<{
  tonality: Tonality
}>()

const emit = defineEmits<{
  selected: [root: ScaleNote]
  removeChord: []
}>()

const chordRoots = [0, 1, 2, 3, 4, 5, 6]

function getChordString(root: ScaleNote): string {
  return Chord.toString({ root }, props.tonality)
}
</script>

<template>
  <button v-for="chordRoot in chordRoots" @click="emit('selected', chordRoot)">
    {{ getChordString(chordRoot) }}
  </button>
  <button @click="emit('removeChord')">Delete</button>
</template>

<style scoped>
div {
  color: white;
}

button {
  min-width: 40px;
  background-color: hsl(180, 90%, 30%);
  color: white;
  border-radius: 4px;
  box-shadow: none;
  padding: 5px;
  border-color: hsl(180, 90%, 40%);
  font-size: 12pt;
  margin: 1px;
}
</style>
