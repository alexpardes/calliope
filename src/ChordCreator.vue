<script setup lang="ts">
import { Chord, getTonality, type ScaleNote, Tonality, TonalityName } from './music'

defineProps<{
  // tonality: Tonality
}>()

const emit = defineEmits<{
  selected: [root: ScaleNote]
  removeChord: []
}>()

const chordRoots = [0, 1, 2, 3, 4, 5, 6]

function getChord(root: ScaleNote): Chord {
  return new Chord(root)
}

function getCurrentTonality(): Tonality {
  return getTonality(TonalityName.Ionian)
}
</script>

<template>
  <button v-for="chordRoot in chordRoots" @click="emit('selected', chordRoot)">
    {{ getChord(chordRoot).toString(getCurrentTonality()) }}
  </button>
  <button @click="emit('removeChord')">Delete</button>
</template>

<style scoped>
div {
  color: white;
}
</style>
