import { useEffect, useState } from 'react'
import Ammeter from './Ammeter.jsx'
import ApparatusTerminal from './ApparatusTerminal.jsx'
import MeterNeedle from './MeterNeedle.jsx'
import PowerSupply from './PowerSupply.jsx'
import Variac from './Variac.jsx'
import Voltmeter from './Voltmeter.jsx'
import Wattmeter from './Wattmeter.jsx'
import useMeterDisplay from '../hooks/useMeterDisplay.js'
import a2MeterImg from '../assets/A2.png'
import acVoltmeterImg from '../assets/AC_voltmeter_equal.png'
import transformerImg from '../assets/transformer.png'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const AUTOTRANSFORMER_OUTPUT_VOLTAGE = 230
const VOLTMETER_MAX = 240
const AMMETER_MAX = 10
const LAMP_LOAD_READING_BY_LEVEL = {
  1: { a1Current: 1.37, a2Current: 1.5, lowerVoltage: 116, wattmeterPower: 115 },
  2: { a1Current: 2.22, a2Current: 3.7, lowerVoltage: 114.5, wattmeterPower: 245 },
  3: { a1Current: 3.37, a2Current: 6.2, lowerVoltage: 112, wattmeterPower: 385 },
  4: { a1Current: 3.37, a2Current: 8.2, lowerVoltage: 112, wattmeterPower: 495 },
}
const NO_LAMP_LOAD_READING = {
  a1Current: 1.02,
  a2Current: 0,
  lowerVoltage: 0,
  wattmeterPower: 20,
}

const EquipmentPanel = ({ onTogglePower, powerOn, readings, setVoltage, voltage }) => {
  const [activeLoadLevel, setActiveLoadLevel] = useState(0)
  const activeVoltage = powerOn ? voltage : 0
  const ammeterCurrent = readings?.i1 ?? 0
  const autotransformerSet = activeVoltage >= AUTOTRANSFORMER_OUTPUT_VOLTAGE
  const displayLoadLevel = autotransformerSet ? activeLoadLevel : 0
  const lampLoadReading = LAMP_LOAD_READING_BY_LEVEL[displayLoadLevel] ?? NO_LAMP_LOAD_READING
  const displayVoltage = autotransformerSet ? AUTOTRANSFORMER_OUTPUT_VOLTAGE : activeVoltage
  const displayAmmeterCurrent = autotransformerSet ? lampLoadReading.a1Current : ammeterCurrent
  const displayWattmeterPower = autotransformerSet ? lampLoadReading.wattmeterPower : activeVoltage * ammeterCurrent
  const displayLowerVoltage = autotransformerSet ? lampLoadReading.lowerVoltage : activeVoltage
  const displayA2Current = autotransformerSet ? lampLoadReading.a2Current : 0
  const lowerVoltmeterDisplay = useMeterDisplay(displayLowerVoltage, VOLTMETER_MAX)
  const lowerAmmeterDisplay = useMeterDisplay(displayA2Current, AMMETER_MAX)

  useEffect(() => {
    if (autotransformerSet || activeLoadLevel === 0) {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => {
      setActiveLoadLevel(0)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [activeLoadLevel, autotransformerSet])

  const handleLoadLevelChange = (nextLoadLevel) => {
    setActiveLoadLevel(clamp(Math.trunc(Number(nextLoadLevel) || 0), 0, 4))
  }

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
          <MeterNeedle className="meter-needle--under-voltmeter" rotation={lowerVoltmeterDisplay.rotation} />
          <ApparatusTerminal number={19} owner="Lower AC voltmeter" polarity="plus" variant="under-voltmeter" />
          <ApparatusTerminal number={20} owner="Lower AC voltmeter" polarity="minus" variant="under-voltmeter" />
        </article>
        <article className="under-variac-meter under-variac-meter--ammeter" id="A2" aria-label="A2 ammeter">
          <img
            alt="A2 meter"
            className="under-variac-meter__image"
            src={a2MeterImg}
          />
          <MeterNeedle className="meter-needle--under-ammeter" rotation={lowerAmmeterDisplay.rotation} />
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
        <Wattmeter
          activeLoadLevel={displayLoadLevel}
          autotransformerSet={autotransformerSet}
          onLoadLevelChange={handleLoadLevelChange}
          value={displayWattmeterPower}
        />
      </div>
    </section>
  )
}

export default EquipmentPanel
