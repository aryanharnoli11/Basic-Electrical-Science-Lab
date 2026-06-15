import needleImg from '../assets/needle.png'

const MeterNeedle = ({ className = '', rotation = -90 }) => (
  <span
    className={`meter-needle ${className}`.trim()}
    style={{ transform: `rotate(${rotation}deg)` }}
    aria-hidden="true"
  >
    <img alt="" className="meter-needle__image" draggable="false" src={needleImg} />
  </span>
)

export default MeterNeedle
