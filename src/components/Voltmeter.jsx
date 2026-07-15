import voltmeterImg from '../assets/voltmeter_1.png'
import useMeterDisplay from '../hooks/useMeterDisplay.js'
import ApparatusTerminal from './ApparatusTerminal.jsx'
import MeterNeedle from './MeterNeedle.jsx'

const VOLTMETER_MAX = 240

const Voltmeter = ({ value = 0 }) => {
  const numericValue = Number.isFinite(value) ? value : 0
  const meterDisplay = useMeterDisplay(numericValue, VOLTMETER_MAX)

  return (
    <article className="lab-meter lab-meter--image lab-meter--voltmeter" id="voltmeter-meter" aria-label="AC voltmeter">
      <span className="lab-meter__image-frame">
        <img alt="AC voltmeter" className="lab-meter__image" src={voltmeterImg} />
      </span>

      <MeterNeedle className="meter-needle--voltmeter" rotation={meterDisplay.rotation} />

      <ApparatusTerminal number={3} owner="AC voltmeter" polarity="plus" variant="voltmeter" />
      <ApparatusTerminal number={4} owner="AC voltmeter" polarity="minus" variant="voltmeter" />
    </article>
  )
}

export default Voltmeter
