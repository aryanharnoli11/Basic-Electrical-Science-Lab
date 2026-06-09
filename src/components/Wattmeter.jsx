import lampLoadImg from '../assets/lampload.png'
import wattmeterImg from '../assets/ac_wattmeter.png'
import ApparatusTerminal from './ApparatusTerminal.jsx'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const Wattmeter = ({ value = 0 }) => {
  const ratio = clamp((Number.isFinite(value) ? value : 0) / 600, 0, 1)
  const angle = 180 - ratio * 180

  return (
    <article className="lab-meter lab-meter--wattmeter" id="wattmeter-meter" aria-label="AC wattmeter">
      <img alt="AC wattmeter" className="lab-meter__image" src={wattmeterImg} />
      <img alt="Lamp load" className="lamp-load-image" src={lampLoadImg} />

      <span
        className="wattmeter-needle"
        style={{ transform: `rotate(${angle}deg)` }}
        aria-hidden="true"
      />

      <ApparatusTerminal number={7} owner="AC wattmeter" polarity="plus" variant="wattmeter" />
      <ApparatusTerminal number={8} owner="AC wattmeter" polarity="minus" variant="wattmeter" />
    </article>
  )
}

export default Wattmeter
