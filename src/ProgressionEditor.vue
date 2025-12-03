<script setup lang="ts">
import { reactive, ref, type Reactive } from 'vue'
import {
  Chord,
  ChordProgression,
  getTonality,
  Tonality,
  TonalityName,
  type ScaleNote,
} from './music'

defineExpose({
  getProgression,
  getCurrentTonality,
  addChord,
  removeChord,
})

const emit = defineEmits<{
  changed: []
}>()

const tonality = ref(TonalityName.Ionian)
const chordRoots: Reactive<ScaleNote[]> = reactive([])

function getChords(): Chord[] {
  return chordRoots.map((root) => new Chord(root))
}

function getProgression(): ChordProgression {
  return new ChordProgression(tonality.value, getChords())
}

function getCurrentTonality(): Tonality {
  return getTonality(tonality.value)
}

function addChord(root: ScaleNote): void {
  chordRoots.push(root)
  emit('changed')
}

function removeChord(): void {
  chordRoots.pop()
}
</script>

<template>
  <div class="chord-progression">
    <select name="tonality" id="tonality" v-model="tonality">
      <option :value="TonalityName.Ionian">Major</option>
      <option :value="TonalityName.Aeolian">N. Minor</option>
      <option :value="TonalityName.HarmonicMinor">H. Minor</option>
    </select>
    <div class="chord-icon" v-for="chord in getChords()">
      {{ chord.toString(getCurrentTonality()) }}
    </div>
  </div>
</template>

<style scoped>
.chord-progression {
  margin: 10px 0px;
}

.chord-icon {
  display: inline-block;
  text-align: center;
  min-width: 40px;
  color: white;
  background-color: hsl(180, 90%, 30%);
  border-color: hsl(180, 90%, 40%);
  margin: 1px;
  padding: 5px;
  border-radius: 4px;
  font-size: 12pt;
}
</style>
