const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const toFiniteNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

export const getMeterRatio = (value, maxValue) => {
  const safeMaxValue = toFiniteNumber(maxValue)

  if (safeMaxValue <= 0) {
    return 0
  }

  return clamp(toFiniteNumber(value) / safeMaxValue, 0, 1)
}

export const getMeterNeedleRotation = (ratio) => (
  -90 + clamp(toFiniteNumber(ratio), 0, 1) * 180
)
