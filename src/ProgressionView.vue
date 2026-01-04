<script setup lang="ts">
import { Chord, ChordProgression, getTonality, TonalityName } from './tonal'
import { styleForChord } from './chordViewUtils'
import { buttonStyle } from './viewUtils'

export interface ProgressionWithVoicings {
  progression: ChordProgression
  voicings: number
}

const progression = defineModel<ProgressionWithVoicings>({ required: true })

function adjustVoicings(amount: number): void {
  const newVoicings = Math.max(1, Math.min(progression.value.voicings + amount, 3))
  progression.value.voicings = newVoicings
}
</script>

<template>
  <div class="chord-progression">
    <select
      name="tonality"
      id="tonality"
      v-model="progression.progression.tonality"
      :style="buttonStyle"
    >
      <option :value="TonalityName.Ionian">Major</option>
      <option :value="TonalityName.HarmonicMinor">H. Minor</option>
      <option :value="TonalityName.Aeolian">N. Minor</option>
      <option :value="TonalityName.Dorian">Dorian</option>
      <option :value="TonalityName.Phrygian">Phyrigian</option>
      <option :value="TonalityName.Lydian">Lydian</option>
      <option :value="TonalityName.Mixolydian">Mixolydian</option>
      <option :value="TonalityName.Locrian">Locrian</option>
    </select>
    <button @click="adjustVoicings(-1)" :style="buttonStyle">-</button>
    {{ progression.voicings }}
    <button @click="adjustVoicings(1)" :style="buttonStyle">+</button>
    <div
      v-for="chord in progression.progression.chords"
      class="chord-icon"
      :style="styleForChord(chord.root)"
    >
      {{ Chord.toString(chord, getTonality(progression.progression.tonality)) }}
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

.stack {
  display: inline-flex;
  /* flex-direction: column; */
}

select {
  padding: 5px;
  margin: 1px;
  border-radius: 4px;
  color: white;
}
</style>
