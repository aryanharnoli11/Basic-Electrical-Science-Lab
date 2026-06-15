import mcbOffImg from '../assets/PowerSupply_Off.png'
import mcbOnImg from '../assets/PowerSupply_ON.png'
import ApparatusTerminal from './ApparatusTerminal.jsx'

const PowerSupply = ({ onTogglePower, powerOn }) => {
  const mcbImg = powerOn ? mcbOnImg : mcbOffImg

  return (
    <article className={`mcb-device mcb-device--${powerOn ? 'on' : 'off'}`} id="power-supply" aria-label="MCB">
      <img
        alt={powerOn ? 'MCB on' : 'MCB off'}
        className="mcb-device__image"
        src={mcbImg}
      />

      <ApparatusTerminal number={1} owner="MCB" polarity="plus" variant="mcb" />
      <ApparatusTerminal number={2} owner="MCB" polarity="minus" variant="mcb" />

      <button
        id="power-toggle-button"
        aria-label={powerOn ? 'Switch MCB off' : 'Switch MCB on'}
        aria-pressed={powerOn}
        className="mcb-device__button"
        onClick={onTogglePower}
        type="button"
      />
    </article>
  )
}

export default PowerSupply
