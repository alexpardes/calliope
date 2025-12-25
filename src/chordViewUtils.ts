import type { StyleValue } from 'vue'
import type { ScaleDegree } from './tonal'
import { err } from './utils'

export function styleForChord(scaleDegree: ScaleDegree): StyleValue {
  return {
    'background-color': colorForChord(scaleDegree),
    border: '1px solid #EEEEEE',
    'font-family': 'Arial',
  }
}

function colorForChord(scaleDegree: ScaleDegree): string {
  switch (scaleDegree) {
    case 0:
      return '#E53935'
    case 1:
      return '#F57C00'
    case 2:
      return '#C0CA33'
    case 3:
      return '#4CAF50'
    case 4:
      return '#00ACC1'
    case 5:
      return '#1976D2'
    case 6:
      return '#9C27B0'
    default:
      err()
  }
}
