<script setup lang="ts">
import { ref } from 'vue'
import { Chord, ChordProgression, MusicPlayer, TonalityName } from './music'
import { randInt, sleep } from './util'

let player: MusicPlayer
MusicPlayer.new().then((musicPlayer) => {
  player = musicPlayer
})

const progressionAnswer = ref('')

async function quiz() {
  progressionAnswer.value = ''
  const testProgressions: ChordProgression[] = [
    new ChordProgression(TonalityName.Ionian, [new Chord(0), new Chord(3), new Chord(4)]),
    new ChordProgression(TonalityName.Ionian, [new Chord(0), new Chord(4), new Chord(3)]),
  ]
  const index = randInt(0, testProgressions.length - 1)

  const progression = testProgressions[index]!
  await player.playProgression(progression)
  await sleep(1000)
  progressionAnswer.value = progression.toString()
}
</script>

<template>
  <button @click="quiz">Quiz</button>
  <div>{{ progressionAnswer }}</div>
</template>

<style scoped>
div {
  color: white;
}
</style>
