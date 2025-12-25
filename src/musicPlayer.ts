import * as Soundfont from 'soundfont-player'
import { type AbsoluteNote } from './tonal'
import { sleep } from './utils'

export class MusicPlayer {
  private activeProgressionToken: object | undefined

  private constructor(private readonly instrument: Soundfont.Player) {}

  public static async new(): Promise<MusicPlayer> {
    const instrument = await Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano')
    return new MusicPlayer(instrument)
  }

  public async playChords(chords: AbsoluteNote[][]): Promise<void> {
    this.instrument.stop()
    const token = {}
    this.activeProgressionToken = token

    for (const chord of chords) {
      if (this.activeProgressionToken !== token) {
        return
      }

      await this.playChord(chord)
      await sleep(750)
    }
  }

  private async playChord(chord: AbsoluteNote[]): Promise<void> {
    this.instrument.stop()
    for (const note of chord) {
      this.instrument.play(note.toString())
    }
  }
}
