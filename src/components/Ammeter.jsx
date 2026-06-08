import ammeterImg from '../assets/A1.png'
import ApparatusTerminal from './ApparatusTerminal.jsx'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const Ammeter = ({ value = 0 }) => {
  const ratio = clamp((Number.isFinite(value) ? value : 0) / 10, 0, 1)
  const angle = 180 - ratio * 180

  return (
    <article className="lab-meter lab-meter--image lab-meter--ammeter" id="ammeter-meter" aria-label="A1 ammeter">
      <img alt="A1 ammeter" className="lab-meter__image" src={ammeterImg} />

      <span
        className="image-meter-needle image-meter-needle--ammeter"
        style={{ transform: `rotate(${angle}deg)` }}
        aria-hidden="true"
      />

      <ApparatusTerminal number={5} owner="Ammeter A1" polarity="plus" variant="ammeter" />
      <ApparatusTerminal number={6} owner="Ammeter A1" polarity="minus" variant="ammeter" />
    </article>
  )
}

export default Ammeter
