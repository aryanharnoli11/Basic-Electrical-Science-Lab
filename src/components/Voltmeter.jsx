import voltmeterImg from '../assets/AC_voltmeter_equal.png'
import ApparatusTerminal from './ApparatusTerminal.jsx'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const Voltmeter = ({ value = 0 }) => {
  const ratio = clamp((Number.isFinite(value) ? value : 0) / 10, 0, 1)
  const angle = 180 - ratio * 180

  return (
    <article className="lab-meter lab-meter--image lab-meter--voltmeter" id="voltmeter-meter" aria-label="AC voltmeter">
      <img alt="AC voltmeter" className="lab-meter__image" src={voltmeterImg} />

      <span
        className="image-meter-needle image-meter-needle--voltmeter"
        style={{ transform: `rotate(${angle}deg)` }}
        aria-hidden="true"
      />

      <ApparatusTerminal number={3} owner="AC voltmeter" polarity="plus" variant="voltmeter" />
      <ApparatusTerminal number={4} owner="AC voltmeter" polarity="minus" variant="voltmeter" />
    </article>
  )
}

export default Voltmeter
