import useEasedRotation from './useEasedRotation.js'
import { getMeterNeedleRotation, getMeterRatio } from '../utils/meterNeedle.js'

const useMeterDisplay = (targetValue, maxValue) => {
  const numericMaxValue = Number(maxValue)
  const safeMaxValue = Number.isFinite(numericMaxValue) ? numericMaxValue : 0
  const targetRotation = getMeterNeedleRotation(getMeterRatio(targetValue, safeMaxValue))
  const rotation = useEasedRotation(targetRotation)

  return {
    rotation,
  }
}

export default useMeterDisplay
