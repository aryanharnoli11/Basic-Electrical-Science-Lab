import { motion } from 'framer-motion'

import { useWalkthrough } from '../useWalkthrough.js'

const WalkthroughStartButton = () => {
  const { experimentName, isOpen, start, totalSteps } = useWalkthrough()

  if (isOpen || totalSteps === 0) {
    return null
  }

  return (
    <motion.button
      aria-label={`Start walkthrough for ${experimentName}`}
      className="walkthrough-start-button"
      id="walkthrough-start-button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => start()}
      type="button"
    >
      <span className="walkthrough-start-button__spark" aria-hidden="true" />
      <span>Start Walkthrough</span>
    </motion.button>
  )
}

export default WalkthroughStartButton
