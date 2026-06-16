import { useEffect, useState } from 'react'
import bulbOffImg from '../assets/bulboff.png'
import bulbOnImg from '../assets/bulbon.png'
import lampLoadImg from '../assets/lampload.png'
import switchOffImg from '../assets/switchoff.png'
import switchOnImg from '../assets/switchon.png'
import wattmeterImg from '../assets/ac_wattmeter.png'
import { getMeterNeedleRotation } from '../utils/meterNeedle.js'
import ApparatusTerminal from './ApparatusTerminal.jsx'
import MeterNeedle from './MeterNeedle.jsx'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const LAMP_LOAD_BULBS = [
  { id: 'r1-c1', row: 1, x: 23.5, y: 30.5 },
  { id: 'r1-c2', row: 1, x: 36.5, y: 30.5 },
  { id: 'r1-c3', row: 1, x: 49.5, y: 30.5 },
  { id: 'r1-c4', row: 1, x: 62.5, y: 30.5 },
  { id: 'r2-c1', row: 2, x: 23.5, y: 44.2 },
  { id: 'r2-c2', row: 2, x: 36.5, y: 44.2 },
  { id: 'r2-c3', row: 2, x: 49.5, y: 44.2 },
  { id: 'r2-c4', row: 2, x: 62.5, y: 44.2 },
  { id: 'r3-c1', row: 3, x: 23.5, y: 57.9 },
  { id: 'r3-c2', row: 3, x: 36.5, y: 57.9 },
  { id: 'r3-c3', row: 3, x: 49.5, y: 57.9 },
  { id: 'r3-c4', row: 3, x: 62.5, y: 57.9 },
  { id: 'r4-c1', row: 4, x: 23.5, y: 71.6 },
  { id: 'r4-c2', row: 4, x: 36.5, y: 71.6 },
  { id: 'r4-c3', row: 4, x: 49.5, y: 71.6 },
  { id: 'r4-c4', row: 4, x: 62.5, y: 71.6 },
]

const LAMP_LOAD_SWITCHES = [
  { id: 'switch-1', row: 1 },
  { id: 'switch-2', row: 2 },
  { id: 'switch-3', row: 3 },
  { id: 'switch-4', row: 4 },
]

const formatCssLength = (value, unit) => (
  typeof value === 'number' ? `${value}${unit}` : value
)

const getBulbStyle = ({ rotation, scale, width, x, y }) => {
  const style = {
    '--bulb-x': `${x}%`,
    '--bulb-y': `${y}%`,
  }

  if (width) {
    style['--bulb-width'] = formatCssLength(width, '%')
  }

  if (rotation) {
    style['--bulb-rotation'] = formatCssLength(rotation, 'deg')
  }

  if (scale) {
    style['--bulb-scale'] = scale
  }

  return style
}

const Wattmeter = ({ autotransformerSet = false, value = 0 }) => {
  const ratio = clamp((Number.isFinite(value) ? value : 0) / 600, 0, 1)
  const rotation = getMeterNeedleRotation(ratio)
  const [activeRows, setActiveRows] = useState([])

  useEffect(() => {
    if (!autotransformerSet) {
      setActiveRows([])
    }
  }, [autotransformerSet])

  const isRowActive = (row) => activeRows.includes(row)

  const handleSwitchClick = (row) => {
    if (!autotransformerSet) {
      return
    }

    setActiveRows((currentRows) => (
      currentRows.includes(row)
        ? currentRows.filter((currentRow) => currentRow !== row)
        : [...currentRows, row]
    ))
  }

  return (
    <article className="lab-meter lab-meter--wattmeter" id="wattmeter-meter" aria-label="AC wattmeter">
      <img alt="AC wattmeter" className="lab-meter__image" src={wattmeterImg} />
      <div className="lamp-load" role="img" aria-label="Lamp load with 16 bulbs">
        <img alt="" className="lamp-load__image" src={lampLoadImg} aria-hidden="true" />
        {LAMP_LOAD_BULBS.map((bulb) => (
          <span
            className="lamp-load__bulb"
            key={bulb.id}
            style={getBulbStyle(bulb)}
          >
            <img
              alt=""
              className="lamp-load__bulb-image"
              src={isRowActive(bulb.row) ? bulbOnImg : bulbOffImg}
              aria-hidden="true"
            />
          </span>
        ))}
        {LAMP_LOAD_SWITCHES.map((switchItem) => (
          <button
            aria-label={`Toggle lamp load row ${switchItem.row}`}
            aria-pressed={isRowActive(switchItem.row)}
            className={`lamp-load__switch lamp-load__switch--${switchItem.row}`}
            disabled={!autotransformerSet}
            key={switchItem.id}
            onClick={() => handleSwitchClick(switchItem.row)}
            type="button"
          >
            <img
              alt=""
              className="lamp-load__switch-image"
              src={isRowActive(switchItem.row) ? switchOnImg : switchOffImg}
              aria-hidden="true"
            />
          </button>
        ))}
        <ApparatusTerminal number={23} owner="Lamp load" polarity="plus" variant="lamp-load" />
        <ApparatusTerminal number={24} owner="Lamp load" polarity="minus" variant="lamp-load" />
      </div>

      <MeterNeedle className="meter-needle--wattmeter" rotation={rotation} />

      <ApparatusTerminal number={7} owner="AC wattmeter" polarity="plus" variant="wattmeter" />
      <ApparatusTerminal number={8} owner="AC wattmeter" polarity="minus" variant="wattmeter" />
      <ApparatusTerminal number={9} owner="AC wattmeter" polarity="plus" variant="wattmeter" />
      <ApparatusTerminal number={10} owner="AC wattmeter" polarity="minus" variant="wattmeter" />
    </article>
  )
}

export default Wattmeter
