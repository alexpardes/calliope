import type { StyleValue } from 'vue'
import type { ScaleDegree } from './tonal'

export function styleForChord(scaleDegree: ScaleDegree): StyleValue {
  const hue = hueForChord(scaleDegree)
  const saturation = 0.65
  const lightness = 0.45
  return {
    'background-color': colorStringFromHsl(hue, saturation, lightness),
    'border-color': colorStringFromHsl(hue, saturation, lightness - 0.05),
  }
}

function colorStringFromHsl(hue: number, saturation: number, lightness: number): string {
  return 'hsl(' + hue + ', ' + saturation * 100 + '%, ' + lightness * 100 + '%)'
}

function hueForChord(scaleDegree: ScaleDegree): number {
  // Evenly space seven notes in hue space.
  return (scaleDegree * 360) / 7 + 10
}
