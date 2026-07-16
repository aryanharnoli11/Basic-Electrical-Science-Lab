import ammeterImg from '../assets/A1.png'
import useMeterDisplay from '../hooks/useMeterDisplay.js'
import ApparatusTerminal from './ApparatusTerminal.jsx'
import MeterNeedle from './MeterNeedle.jsx'

const AMMETER_MAX = 10

const Ammeter = ({ value = 0 }) => {
  const numericValue = Number.isFinite(value) ? value : 0
  const meterDisplay = useMeterDisplay(numericValue, AMMETER_MAX)

  return (
    <article className="lab-meter lab-meter--image lab-meter--ammeter" id="A1" aria-label="AC Ammeter A1">
      <span className="lab-meter__image-frame">
        <img alt="AC Ammeter A1" className="lab-meter__image" src={ammeterImg} />
      </span>

      <MeterNeedle className="meter-needle--ammeter" rotation={meterDisplay.rotation} />

      <ApparatusTerminal number={5} owner="Ammeter A1" polarity="plus" variant="ammeter" />
      <ApparatusTerminal number={6} owner="Ammeter A1" polarity="minus" variant="ammeter" />
    </article>
  )
}

export default Ammeter
