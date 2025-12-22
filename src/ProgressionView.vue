<script setup lang="ts">
import { Chord, getTonality, TonalityName, type ChordFunction } from './tonal'

defineProps<{ chords: ChordFunction[] }>()
const tonality = defineModel<TonalityName>({ required: true })
</script>

<template>
  <div class="chord-progression">
    <select name="tonality" id="tonality" v-model="tonality">
      <option :value="TonalityName.Ionian">Major</option>
      <option :value="TonalityName.Aeolian">N. Minor</option>
      <option :value="TonalityName.HarmonicMinor">H. Minor</option>
    </select>
    <div class="chord-icon" v-for="chord in chords">
      {{ Chord.toString(chord, getTonality(tonality)) }}
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
