
import Ammeter from './Ammeter.jsx'
import PowerSupply from './PowerSupply.jsx'
import Variac from './Variac.jsx'
import Voltmeter from './Voltmeter.jsx'
import Wattmeter from './Wattmeter.jsx'
import a2MeterImg from '../assets/A2.png'
import acVoltmeterImg from '../assets/AC_voltmeter_equal.png'
import transformerImg from '../assets/transformer.png'

const EquipmentPanel = ({ onTogglePower, powerOn, readings, setVoltage, voltage }) => {
  const activeVoltage = powerOn ? voltage : 0
  const ammeterCurrent = readings?.i1 ?? 0
  const wattmeterPower = activeVoltage * ammeterCurrent

  return (
    <section className="equipment-panel" id="equipment-panel">
      <div className="equipment-panel__source-stack">
        <PowerSupply
          onTogglePower={onTogglePower}
          powerOn={powerOn}
        />
        <Variac
          powerOn={powerOn}
          setVoltage={setVoltage}
          voltage={voltage}
        />
        <img
          alt="A2 meter"
          className="under-variac-meter"
          id="A2"
          src={a2MeterImg}
        />
        <img
          alt="AC voltmeter"
          className="under-variac-meter"
          id="V2"
          src={acVoltmeterImg}
        />
        <img
          alt="Transformer"
          className="transformer-device"
          src={transformerImg}
        />
      </div>

      <div className="equipment-panel__meter-row">
        <Voltmeter value={activeVoltage} />
        <Ammeter value={ammeterCurrent} />
        <Wattmeter value={wattmeterPower} />
      </div>
    </section>
  )
}

export default EquipmentPanel
