<script setup lang="ts">
import { reactive, ref } from 'vue'
import { randInt, sleep } from './utils'
import ProgressionView, { type ProgressionWithVoicings } from './ProgressionView.vue'
import ChordCreator from './ChordCreator.vue'
import {
  Chord,
  ChordMovement,
  ChordProgression,
  getTonality,
  PositionedChordProgression,
  Tonality,
  TonalityName,
  type AbsoluteNote,
  type ProgressionVoicing,
} from './tonal'
import { MusicPlayer } from './musicPlayer'
import { buttonStyle } from './viewUtils'

let player: MusicPlayer
MusicPlayer.new().then((musicPlayer) => {
  player = musicPlayer
})

const selectedIndex = ref(0)

// TODO: Progression states should be stored in this component.
const progressions = reactive<ProgressionWithVoicings[]>([newProgression()])
const progressionAnswer = ref('')

function selectProgression(index: number) {
  selectedIndex.value = index
}

function getSelectedProgression(): ProgressionWithVoicings {
  return progressions[selectedIndex.value]!
}

function getSelectedTonality(): Tonality {
  return getTonality(getSelectedProgression().progression.tonality)
}

function newProgression(
  tonality: TonalityName = TonalityName.Ionian,
  voicings: number = 3,
): ProgressionWithVoicings {
  return { progression: { tonality, chords: [] }, voicings }
}

function addProgression(): void {
  const selectedProgression = getSelectedProgression()
  progressions.push(
    newProgression(selectedProgression.progression.tonality, selectedProgression.voicings),
  )
  selectedIndex.value = progressions.length - 1
}

function deleteProgression(): void {
  const tonality = progressions.splice(selectedIndex.value, 1)[0]!.progression.tonality
  if (progressions.length === 0) {
    progressions.push(newProgression(tonality))
  }

  if (selectedIndex.value >= progressions.length) {
    selectedIndex.value = progressions.length - 1
  }
}

const tonalCenter: AbsoluteNote = 60

async function quiz(): Promise<void> {
  progressionAnswer.value = ''
  const progression = chooseRandomProgression()
  if (progression === undefined) {
    return
  }

  await player.playChords(createEstablishingPattern(progression.tonality, tonalCenter), 200)
  await sleep(400)
  player.stop()
  await sleep(800)

  await player.playPositionedProgression(progression, tonalCenter, 1000)
  await sleep(500)
  progressionAnswer.value = PositionedChordProgression.toString(progression)
}

function createEstablishingPattern(
  tonalityName: TonalityName,
  tonalCenter: AbsoluteNote,
): AbsoluteNote[][] {
  const tonality = getTonality(tonalityName)
  return [4, 5, 4, 3, 2, 1, -1, 0].map((degree) => [tonality.getNote(degree) + tonalCenter])
}

function chooseRandomProgression(): PositionedChordProgression | undefined {
  const nonEmptyProgressionIndices: number[] = progressions
    .map((progression, index) => [progression, index] as [ProgressionWithVoicings, number])
    .filter(([progression, _]) => progression.progression.chords.length > 0)
    .map(([_, index]) => index)

  if (nonEmptyProgressionIndices.length === 0) {
    return undefined
  }

  const progressionIndex =
    nonEmptyProgressionIndices[randInt(0, nonEmptyProgressionIndices.length - 1)]!

  const { progression: originalProgression, voicings } = progressions[progressionIndex]!

  const originalVoicing: ProgressionVoicing = {
    firstChordPosition: randInt(1, voicings) % 3,
    chordMovements: Array.from(
      { length: originalProgression.chords.length - 1 },
      () => ChordMovement.Up,
    ),
  }

  let progression = originalProgression
  let voicing = originalVoicing

  const shouldAlter: boolean = originalProgression.chords.length > 1 && randInt(0, 1) === 1
  if (shouldAlter) {
    // TODO: Support swapping chords as an alteration.
    const chordIdxToAlter = randInt(0, originalProgression.chords.length - 1)
    const alteredChord = {
      root: (originalProgression.chords[chordIdxToAlter]!.root + randInt(1, 7)) % 7,
    }

    const alteredChords = [...originalProgression.chords]
    alteredChords[chordIdxToAlter] = alteredChord

    progression = { ...originalProgression, chords: alteredChords }
    if (chordIdxToAlter === 0) {
      // We want the altered progression to have the same chord movements as in the original voicing.
      // Due to our represenation of the voicing, when altering the first chord,
      // we may have to change the first chord position to preserve the movement direction between
      // the first and second chords.
      // TODO: Handle progressions with a single chord.
      const secondChordMovement = originalVoicing.chordMovements[0]!
      const positionedSecondChord = Chord.placeWithMovement(
        originalProgression.chords[1]!,
        { chord: originalProgression.chords[0]!, position: originalVoicing.firstChordPosition },
        secondChordMovement,
      )
      voicing = {
        ...originalVoicing,
        firstChordPosition: Chord.placeWithMovement(
          alteredChord,
          positionedSecondChord,
          ChordProgression.oppositeMovement(secondChordMovement),
        ).position,
      }
    }
  }

  return PositionedChordProgression.fromVoicedProgression({ progression, voicing })
}
</script>

<template>
  <div>
    <div>
      <button @click="addProgression()" :style="buttonStyle">Add Progression</button>
      <button @click="deleteProgression()" :style="buttonStyle">Delete Progression</button>
      <button @click="quiz()" :style="buttonStyle">Quiz</button>
    </div>
    <div>
      <div>{{ progressionAnswer }}</div>
    </div>
    <div>
      <ChordCreator
        :tonality="getSelectedTonality()"
        @selected="(root) => getSelectedProgression().progression.chords.push({ root })"
        @remove-chord="getSelectedProgression().progression.chords.pop()"
      />
    </div>
    <div v-for="(progression, index) in progressions">
      <div
        :class="['progression', { 'selected-progression': selectedIndex === index }]"
        @mousedown="selectProgression(index)"
      >
        <ProgressionView v-model="progressions[index]!" />
      </div>
    </div>
  </div>
</template>

<style scoped>
div {
  color: white;
}

button {
  padding: 5px;
  margin: 1px;
  color: white;
  border-radius: 4px;
  font-size: 12pt;
}

.progression {
  display: inline-block;
  min-width: 360;
  border: 1px solid transparent;
  border-radius: 4px;
}

.selected-progression {
  display: inline-block;
  min-width: 360px;
  border: 1px solid white;
  border-radius: 4px;
}
</style>
