export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function err(message: string = ''): never {
  throw new Error(message)
}

export function assert(condition: boolean, message: string = ''): void {
  if (!condition) {
    err(message)
  }
}
