
import Ammeter from './Ammeter.jsx'
import PowerSupply from './PowerSupply.jsx'

const EquipmentPanel = ({ onTogglePower, powerOn, readings, setVoltage, voltage }) => (
  <section className="equipment-panel" id="equipment-panel">
    <PowerSupply
      onTogglePower={onTogglePower}
      powerOn={powerOn}
      setVoltage={setVoltage}
      voltage={voltage}
    />

    <Ammeter label="A1" value={readings.A1} />
    <Ammeter label="A2" value={readings.A2} />
    <Ammeter label="A3" value={readings.A3} />
  </section>
)

export default EquipmentPanel
