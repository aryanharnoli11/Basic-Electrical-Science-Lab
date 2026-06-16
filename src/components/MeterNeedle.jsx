import needleImg from '../assets/needle.png'
import useDampedRotation from '../hooks/useDampedRotation.js'

const MeterNeedle = ({ className = '', rotation = -90 }) => {
  const displayRotation = useDampedRotation(rotation)

  return (
    <span
      className={`meter-needle ${className}`.trim()}
      style={{ transform: `rotate(${displayRotation}deg)` }}
      aria-hidden="true"
    >
      <img alt="" className="meter-needle__image" draggable="false" src={needleImg} />
    </span>
  )
}

export default MeterNeedle
