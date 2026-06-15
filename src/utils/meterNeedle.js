export const getMeterNeedleRotation = (ratio) => (
  -90 + Math.min(Math.max(ratio, 0), 1) * 180
)
