
import Ammeter from './Ammeter.jsx'
import ApparatusTerminal from './ApparatusTerminal.jsx'
import MeterNeedle from './MeterNeedle.jsx'
import PowerSupply from './PowerSupply.jsx'
import Variac from './Variac.jsx'
import Voltmeter from './Voltmeter.jsx'
import Wattmeter from './Wattmeter.jsx'
import { getMeterNeedleRotation } from '../utils/meterNeedle.js'
import a2MeterImg from '../assets/A2.png'
import acVoltmeterImg from '../assets/AC_voltmeter_equal.png'
import transformerImg from '../assets/transformer.png'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const AUTOTRANSFORMER_OUTPUT_VOLTAGE = 230
const VOLTMETER_MAX = 240
const TRANSFORMER_LOAD_CURRENT = 1.02
const TRANSFORMER_LOAD_POWER = 40

const EquipmentPanel = ({ onTogglePower, powerOn, readings, setVoltage, voltage }) => {
  const activeVoltage = powerOn ? voltage : 0
  const ammeterCurrent = readings?.i1 ?? 0
  const branchCurrent = readings?.i2 ?? 0
  const autotransformerSet = activeVoltage >= AUTOTRANSFORMER_OUTPUT_VOLTAGE
  const displayVoltage = autotransformerSet ? AUTOTRANSFORMER_OUTPUT_VOLTAGE : activeVoltage
  const displayAmmeterCurrent = autotransformerSet ? TRANSFORMER_LOAD_CURRENT : ammeterCurrent
  const displayWattmeterPower = autotransformerSet ? TRANSFORMER_LOAD_POWER : activeVoltage * ammeterCurrent
  const lowerVoltmeterRotation = getMeterNeedleRotation(clamp(displayVoltage / VOLTMETER_MAX, 0, 1))
  const lowerAmmeterRotation = getMeterNeedleRotation(clamp(branchCurrent / 10, 0, 1))

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
        <article className="under-variac-meter under-variac-meter--voltmeter" id="V2" aria-label="AC voltmeter under variac">
          <img
            alt="AC voltmeter"
            className="under-variac-meter__image"
            src={acVoltmeterImg}
          />
          <MeterNeedle className="meter-needle--under-voltmeter" rotation={lowerVoltmeterRotation} />
          <ApparatusTerminal number={19} owner="Lower AC voltmeter" polarity="plus" variant="under-voltmeter" />
          <ApparatusTerminal number={20} owner="Lower AC voltmeter" polarity="minus" variant="under-voltmeter" />
        </article>
        <article className="under-variac-meter under-variac-meter--ammeter" id="A2" aria-label="A2 ammeter">
          <img
            alt="A2 meter"
            className="under-variac-meter__image"
            src={a2MeterImg}
          />
          <MeterNeedle className="meter-needle--under-ammeter" rotation={lowerAmmeterRotation} />
          <ApparatusTerminal number={21} owner="Ammeter A2" polarity="plus" variant="ammeter-a2" />
          <ApparatusTerminal number={22} owner="Ammeter A2" polarity="minus" variant="ammeter-a2" />
        </article>
        <article className="transformer-device" id="transformer-device" aria-label="Transformer">
          <img
            alt="Transformer"
            className="transformer-device__image"
            src={transformerImg}
          />
          <ApparatusTerminal number={15} owner="Transformer input" polarity="plus" variant="transformer-input" />
          <ApparatusTerminal number={17} owner="Transformer input" polarity="minus" variant="transformer-input" />
          <ApparatusTerminal number={16} owner="Transformer output" polarity="plus" variant="transformer-output" />
          <ApparatusTerminal number={18} owner="Transformer output" polarity="minus" variant="transformer-output" />
        </article>
      </div>

      <div className="equipment-panel__meter-row">
        <Voltmeter value={displayVoltage} />
        <Ammeter value={displayAmmeterCurrent} />
        <Wattmeter autotransformerSet={autotransformerSet} value={displayWattmeterPower} />
      </div>
    </section>
  )
}

export default EquipmentPanel
