import knobImg from '../assets/knob.png'
import variacImg from '../assets/Variacoff.png'

const Variac = ({ powerOn, setVoltage, voltage }) => {
  const handleVoltageChange = (event) => {
    setVoltage(Number(Number(event.target.value).toFixed(1)))
  }

  const rotation = -120 + (voltage / 10) * 240

  return (
    <article className="variac-device" aria-label="Variac voltage controller">
      <img alt="Variac off" className="variac-device__image" src={variacImg} />
      <img
        alt=""
        aria-hidden="true"
        className="variac-device__knob"
        src={knobImg}
        style={{ transform: `rotate(${rotation}deg)` }}
      />

      <label className="variac-device__control" id="voltage-control">
        <span className="sr-only">Voltage</span>
        <input
          aria-label="Voltage"
          className="variac-device__range"
          disabled={!powerOn}
          id="voltage-slider"
          max="10"
          min="0"
          onChange={handleVoltageChange}
          step="0.1"
          type="range"
          value={voltage}
        />
      </label>
    </article>
  )
}

export default Variac
