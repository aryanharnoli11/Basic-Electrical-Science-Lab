import ammeterImg from '../assets/A1.png'
import { getMeterNeedleRotation } from '../utils/meterNeedle.js'
import ApparatusTerminal from './ApparatusTerminal.jsx'
import MeterNeedle from './MeterNeedle.jsx'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const Ammeter = ({ value = 0 }) => {
  const ratio = clamp((Number.isFinite(value) ? value : 0) / 10, 0, 1)
  const rotation = getMeterNeedleRotation(ratio)

  return (
    <article className="lab-meter lab-meter--image lab-meter--ammeter" id="ammeter-meter" aria-label="A1 ammeter">
      <img alt="A1 ammeter" className="lab-meter__image" src={ammeterImg} />

      <MeterNeedle className="meter-needle--ammeter" rotation={rotation} />

      <ApparatusTerminal number={5} owner="Ammeter A1" polarity="plus" variant="ammeter" />
      <ApparatusTerminal number={6} owner="Ammeter A1" polarity="minus" variant="ammeter" />
    </article>
  )
}

export default Ammeter
