import { Fragment } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const positiveTerminals = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25])

const getTerminalPolarity = (number) => (
  positiveTerminals.has(number) ? 'plus' : 'minus'
)

const getMeterAngle = (value, maxValue) => {
  const ratio = maxValue > 0 ? clamp(value / maxValue, 0, 1) : 0

  return -64 + ratio * 128
}

const Terminal = ({ number, x, y, polarity = getTerminalPolarity(number) }) => {
  const endpointId = `${number}-endpoint`

  return (
    <Fragment>
      <span
        id={endpointId}
        className={`connection-terminal connection-terminal--reference connection-terminal--endpoint-${number}`}
        data-polarity={polarity}
        aria-label={`Terminal ${number}`}
        title={`Terminal ${number} (${endpointId})`}
        style={{
          '--jtk-endpoint-offset-x': '0px',
          '--jtk-endpoint-offset-y': '0px',
          '--terminal-base-left': `${x}px`,
          '--terminal-base-top': `${y}px`,
        }}
      />
      <span
        className={`terminal-number-label terminal-number-label--reference terminal-number-label--endpoint-${number}`}
        data-terminal-id={endpointId}
        title={`Terminal ${number} (${endpointId})`}
        style={{
          left: `${x + 9}px`,
          top: `${y + 21}px`,
        }}
      >
        {number}
      </span>
    </Fragment>
  )
}

const MeterGauge = ({
  className = '',
  heading,
  label,
  maxValue = 10,
  scaleLabels = ['0', '5', '10'],
  terminals = [],
  value = 0,
}) => {
  const angle = getMeterAngle(Number.isFinite(value) ? value : 0, maxValue)
  const tickAngles = [-64, -48, -32, -16, 0, 16, 32, 48, 64]

  return (
    <article className={`reference-meter ${className}`} aria-label={`${label} ${heading}`}>
      <h3>{heading}</h3>
      <div className="reference-meter__body">
        <svg className="reference-meter__dial" viewBox="0 0 132 82" aria-hidden="true">
          <path className="reference-meter__face" d="M16 70 A50 50 0 0 1 116 70 Z" />
          {tickAngles.map((tickAngle) => (
            <line
              key={tickAngle}
              className="reference-meter__tick"
              x1="66"
              y1="66"
              x2="66"
              y2="17"
              transform={`rotate(${tickAngle} 66 66)`}
            />
          ))}
          <text x="21" y="62">{scaleLabels[0]}</text>
          <text x="62" y="25">{scaleLabels[1]}</text>
          <text x="102" y="62">{scaleLabels[2]}</text>
          <line
            className="reference-meter__needle"
            x1="66"
            y1="66"
            x2="66"
            y2="27"
            transform={`rotate(${angle} 66 66)`}
          />
          <circle className="reference-meter__pivot" cx="66" cy="66" r="4" />
        </svg>
        <span className="reference-meter__label">{label}</span>
      </div>

      {terminals.map((terminal) => (
        <Terminal key={terminal.number} {...terminal} />
      ))}
    </article>
  )
}

const FourTerminalMeter = ({ power = 0, terminals }) => {
  const angle = getMeterAngle(power, 100)
  const tickAngles = [-66, -50, -34, -18, -2, 14, 30, 46, 62]

  return (
    <article className="reference-meter reference-meter--wattmeter" aria-label="Wattmeter">
      <h3>WATTMETER</h3>
      <div className="reference-meter__body reference-meter__body--wattmeter">
        <svg className="reference-meter__dial reference-meter__dial--wattmeter" viewBox="0 0 132 96" aria-hidden="true">
          <path className="reference-meter__face reference-meter__face--wattmeter" d="M10 80 A56 56 0 0 1 122 80 Z" />
          {tickAngles.map((tickAngle) => (
            <line
              key={tickAngle}
              className="reference-meter__tick"
              x1="66"
              y1="78"
              x2="66"
              y2="20"
              transform={`rotate(${tickAngle} 66 78)`}
            />
          ))}
          <text x="18" y="72">0</text>
          <text x="61" y="29">50</text>
          <text x="99" y="72">100</text>
          <line
            className="reference-meter__needle"
            x1="66"
            y1="78"
            x2="66"
            y2="31"
            transform={`rotate(${angle} 66 78)`}
          />
          <circle className="reference-meter__pivot" cx="66" cy="78" r="4" />
          <text className="reference-meter__unit" x="58" y="85">(W)</text>
        </svg>
        <span className="reference-meter__label">W1</span>
      </div>
      <div className="reference-meter__terminal-captions" aria-hidden="true">
        <span>V</span>
        <span>D</span>
        <span>M</span>
        <span>C</span>
      </div>

      {terminals.map((terminal) => (
        <Terminal key={terminal.number} {...terminal} />
      ))}
    </article>
  )
}

const MCB = ({ onTogglePower, powerOn }) => (
  <article className={`mcb ${powerOn ? 'mcb--on' : ''}`} aria-label="MCB">
    <h3>MCB</h3>
    <div className="mcb__body">
      <span className="mcb__indicator" />
      <button
        id="power-toggle-button"
        aria-label={powerOn ? 'Switch power supply off' : 'Switch power supply on'}
        aria-pressed={powerOn}
        className="mcb__switch"
        onClick={onTogglePower}
        type="button"
      />
    </div>
    <Terminal number={1} x={16} y={107} />
    <Terminal number={2} x={42} y={107} />
  </article>
)

const Variac = ({ powerOn, setVoltage, voltage }) => {
  const handleVoltageChange = (event) => {
    setVoltage(Number(Number(event.target.value).toFixed(1)))
  }

  return (
    <article className="variac" aria-label="Variac">
      <h3>VARIAC</h3>
      <div className="variac__knob-wrap" id="voltage-control">
        <div
          className="variac__knob"
          style={{ '--variac-angle': `${-120 + voltage * 24}deg` }}
        >
          <span className="variac__pointer" />
          <span className="variac__center" />
        </div>
        <label className="variac__range-label">
          <span className="sr-only">Voltage</span>
          <input
            aria-label="Voltage"
            className="variac__range"
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
      </div>
      <div className="variac__terminal-box" aria-hidden="true">
        <span>INPUT</span>
        <span>OUTPUT</span>
        <b>+</b>
        <b>-</b>
      </div>
      <Terminal number={23} x={205} y={38} />
      <Terminal number={24} x={263} y={38} />
      <Terminal number={25} x={205} y={101} />
      <Terminal number={26} x={263} y={101} />
    </article>
  )
}

const Resistor = ({ value }) => (
  <article className="load-device load-device--resistor" aria-label="Resistor">
    <h3>RESISTOR</h3>
    <svg viewBox="0 0 220 70" aria-hidden="true">
      <path className="load-device__lead" d="M0 35 H58" />
      <path className="load-device__symbol" d="M58 35 L68 16 L80 54 L92 16 L104 54 L116 16 L128 54 L140 16 L152 54 L162 35" />
      <path className="load-device__lead" d="M162 35 H220" />
    </svg>
    <span className="load-device__value">{value} ohm</span>
    <Terminal number={17} x={6} y={27} />
    <Terminal number={18} x={235} y={27} />
  </article>
)

const Capacitor = ({ value }) => (
  <article className="capacitor-device" aria-label="Capacitor">
    <div className="capacitor-device__can">
      <span>CAPACITOR</span>
      <i />
    </div>
    <span className="capacitor-device__value">{value} ohm</span>
    <Terminal number={21} x={20} y={104} />
    <Terminal number={22} x={58} y={91} />
  </article>
)

const Inductor = ({ value }) => {
  const spokes = Array.from({ length: 28 }, (_, index) => index)

  return (
    <article className="inductor-device" aria-label="Inductor">
      <h3>INDUCTOR</h3>
      <div className="inductor-device__coil" aria-hidden="true">
        {spokes.map((spoke) => (
          <span key={spoke} style={{ '--spoke-angle': `${spoke * (360 / spokes.length)}deg` }} />
        ))}
        <i />
      </div>
      <span className="inductor-device__value">{value} ohm</span>
      <Terminal number={19} x={34} y={98} />
      <Terminal number={20} x={70} y={98} />
    </article>
  )
}

const ExperimentBoard = ({
  onTogglePower,
  powerOn,
  r1,
  r2,
  r3,
  readings,
  setVoltage,
  voltage,
}) => {
  const totalCurrent = readings.A1 ?? 0
  const branchCurrentA = readings.A2 ?? 0
  const branchCurrentB = readings.A3 ?? 0
  const wattage = powerOn ? voltage * totalCurrent : 0

  return (
    <section className="experiment-board" id="circuit-panel" aria-label="Electrical machine experiment board">
      <div className="experiment-board__equipment-hitbox" id="equipment-panel" aria-hidden="true" />

      <MCB onTogglePower={onTogglePower} powerOn={powerOn} />
      <MeterGauge
        className="reference-meter--voltmeter"
        heading="VOLTMETER"
        label="V1"
        maxValue={10}
        scaleLabels={['0', '5', '10']}
        terminals={[
          { number: 3, x: 28, y: 101 },
          { number: 4, x: 77, y: 101 },
        ]}
        value={powerOn ? voltage : 0}
      />
      <MeterGauge
        className="reference-meter--a1"
        heading="AMMETER"
        label="A1"
        terminals={[
          { number: 5, x: 28, y: 101 },
          { number: 6, x: 77, y: 101 },
        ]}
        value={totalCurrent}
      />
      <FourTerminalMeter
        power={wattage}
        terminals={[
          { number: 7, x: 15, y: 142 },
          { number: 8, x: 47, y: 142 },
          { number: 9, x: 79, y: 142 },
          { number: 10, x: 111, y: 142 },
        ]}
      />
      <MeterGauge
        className="reference-meter--a2"
        heading="AMMETER"
        label="A2"
        terminals={[
          { number: 11, x: 28, y: 101 },
          { number: 12, x: 77, y: 101 },
        ]}
        value={totalCurrent}
      />
      <MeterGauge
        className="reference-meter--a3"
        heading="AMMETER"
        label="A3"
        terminals={[
          { number: 13, x: 28, y: 101 },
          { number: 14, x: 77, y: 101 },
        ]}
        value={branchCurrentA}
      />
      <MeterGauge
        className="reference-meter--a4"
        heading="AMMETER"
        label="A4"
        terminals={[
          { number: 15, x: 28, y: 101 },
          { number: 16, x: 77, y: 101 },
        ]}
        value={branchCurrentB}
      />

      <Variac powerOn={powerOn} setVoltage={setVoltage} voltage={voltage} />
      <Resistor value={r1} />
      <Capacitor value={r2} />
      <Inductor value={r3} />
    </section>
  )
}

export default ExperimentBoard
