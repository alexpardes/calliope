<script setup lang="ts">
import { ref, useTemplateRef, type Ref } from 'vue'
import { Chord, ChordProgression, MusicPlayer, TonalityName } from './music'
import { randInt, sleep } from './util'
import ProgressionEditor from './ProgressionEditor.vue'

let player: MusicPlayer
MusicPlayer.new().then((musicPlayer) => {
  player = musicPlayer
})

const progressionEditor =
  useTemplateRef<InstanceType<typeof ProgressionEditor>>('progressionEditor')

const progressionAnswer = ref('')

async function quiz() {
  progressionAnswer.value = ''

  const progression = progressionEditor.value!.getProgression()
  await player.playProgression(progression)
  await sleep(1000)
  progressionAnswer.value = progression.toString()
}
</script>

<template>
  <ProgressionEditor ref="progressionEditor" />
  <div>
    <button @click="quiz()">Quiz</button>
    {{ progressionAnswer }}
  </div>
</template>

<style scoped>
div {
  color: white;
}
</style>
