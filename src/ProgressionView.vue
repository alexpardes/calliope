<script setup lang="ts">
import { Chord, getTonality, TonalityName, type ChordFunction } from './tonal'
import { styleForChord } from './chordViewUtils'
import { buttonStyle } from './viewUtils'

defineProps<{ chords: ChordFunction[] }>()
const tonality = defineModel<TonalityName>({ required: true })
</script>

<template>
  <div class="chord-progression">
    <select name="tonality" id="tonality" v-model="tonality" :style="buttonStyle">
      <option :value="TonalityName.Ionian">Major</option>
      <option :value="TonalityName.Aeolian">N. Minor</option>
      <option :value="TonalityName.HarmonicMinor">H. Minor</option>
    </select>
    <div v-for="chord in chords" class="chord-icon" :style="styleForChord(chord.root)">
      {{ Chord.toString(chord, getTonality(tonality)) }}
    </div>
  </div>
</template>

<style scoped>
.chord-progression {
  margin: 2px;
}

.chord-icon {
  display: inline-block;
  text-align: center;
  min-width: 40px;
  color: white;
  margin: 1px;
  padding: 5px;
  border-radius: 4px;
  font-size: 12pt;
}

select {
  padding: 5px;
  margin: 1px;
  border-radius: 4px;
  color: white;
}
</style>
