import knobImg from '../assets/knob.png'
import variacOffImg from '../assets/Variacoff.png'
import variacOnImg from '../assets/Variacon.png'
import ApparatusTerminal from './ApparatusTerminal.jsx'

const OUTPUT_VOLTAGE = 230
const MIN_KNOB_ROTATION = -70
const MAX_KNOB_ROTATION = 235

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const Variac = ({ powerOn, setVoltage, voltage }) => {
  const handleKnobClick = () => {
    if (!powerOn) {
      return
    }

    setVoltage(OUTPUT_VOLTAGE)
  }

  const voltageRatio = clamp(voltage / OUTPUT_VOLTAGE, 0, 1)
  const rotation = MIN_KNOB_ROTATION + voltageRatio * (MAX_KNOB_ROTATION - MIN_KNOB_ROTATION)
  const variacImg = powerOn ? variacOnImg : variacOffImg

  return (
    <article className="variac-device" aria-label="Variac voltage controller">
      <img alt={powerOn ? 'Autotransformer on' : 'Autotransformer off'} className="variac-device__image" src={variacImg} />
      <img
        alt=""
        aria-hidden="true"
        className="variac-device__knob"
        src={knobImg}
        style={{ transform: `rotate(${rotation}deg)` }}
      />

      <ApparatusTerminal number={11} owner="Variac input" polarity="plus" variant="variac-input" />
      <ApparatusTerminal number={12} owner="Variac input" polarity="minus" variant="variac-input" />
      <ApparatusTerminal number={13} owner="Variac output" polarity="plus" variant="variac-output" />
      <ApparatusTerminal number={14} owner="Variac output" polarity="minus" variant="variac-output" />

      <button
        aria-label="Set autotransformer to 230 volts"
        className="variac-device__control"
        disabled={!powerOn}
        id="voltage-control"
        onClick={handleKnobClick}
        type="button"
      >
        <span className="sr-only">Set autotransformer to 230 volts</span>
      </button>
    </article>
  )
}

export default Variac
