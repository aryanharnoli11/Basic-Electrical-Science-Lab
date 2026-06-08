
import Ammeter from './Ammeter.jsx'
import PowerSupply from './PowerSupply.jsx'
import Variac from './Variac.jsx'
import Voltmeter from './Voltmeter.jsx'
import Wattmeter from './Wattmeter.jsx'

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
      </div>

      <Voltmeter value={activeVoltage} />
      <Ammeter value={ammeterCurrent} />
      <Wattmeter value={wattmeterPower} />
    </section>
  )
}

export default EquipmentPanel
