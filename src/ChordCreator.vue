<script setup lang="ts">
import { styleForChord } from './chordViewUtils'
import { Chord, type ScaleDegree, Tonality } from './tonal'
import { buttonStyle } from './viewUtils'

const props = defineProps<{
  tonality: Tonality
}>()

const emit = defineEmits<{
  selected: [root: ScaleDegree]
  removeChord: []
}>()

const chordRoots: ScaleDegree[] = [0, 1, 2, 3, 4, 5, 6]

function getChordString(root: ScaleDegree): string {
  return Chord.toString({ root }, props.tonality)
}
</script>

<template>
  <button
    v-for="chordRoot in chordRoots"
    @click="emit('selected', chordRoot)"
    :style="styleForChord(chordRoot)"
  >
    {{ getChordString(chordRoot) }}
  </button>
  <button @click="emit('removeChord')" :style="buttonStyle">Delete</button>
</template>

<style scoped>
div {
  color: white;
}

button {
  min-width: 40px;
  color: white;
  border-radius: 4px;
  padding: 5px;
  font-size: 12pt;
  margin: 1px;
}
</style>
