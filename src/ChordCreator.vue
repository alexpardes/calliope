<script setup lang="ts">
import { Chord, getTonality, type ScaleNote, Tonality, TonalityName } from './music'

const props = defineProps<{
  tonality: Tonality
}>()

const emit = defineEmits<{
  selected: [root: ScaleNote]
  removeChord: []
}>()

const chordRoots = [0, 1, 2, 3, 4, 5, 6]

function getChord(root: ScaleNote): Chord {
  return new Chord(root)
}
</script>

<template>
  <button v-for="chordRoot in chordRoots" @click="emit('selected', chordRoot)">
    {{ getChord(chordRoot).toString(props.tonality) }}
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
