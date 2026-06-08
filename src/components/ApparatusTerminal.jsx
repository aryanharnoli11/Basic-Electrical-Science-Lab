const polarityText = {
  minus: 'negative',
  plus: 'positive',
}

const ApparatusTerminal = ({ number, owner, polarity, variant }) => {
  const terminalId = `${number}-endpoint`
  const terminalPolarity = polarityText[polarity] ?? polarity
  const title = `${owner} ${terminalPolarity} (${terminalId})`

  return (
    <>
      <span
        id={terminalId}
        className={[
          'connection-terminal',
          'connection-terminal--apparatus',
          `connection-terminal--${variant}`,
          `connection-terminal--${variant}-${polarity}`,
          `connection-terminal--endpoint-${number}`,
        ].join(' ')}
        data-polarity={polarity}
        aria-label={`${owner} ${terminalPolarity} terminal ${number}`}
        title={title}
      />
      <span
        className={[
          'terminal-number-label',
          'terminal-number-label--apparatus',
          `terminal-number-label--${variant}-${polarity}`,
          `terminal-number-label--endpoint-${number}`,
        ].join(' ')}
        data-terminal-id={terminalId}
        title={title}
      >
        {number}
      </span>
    </>
  )
}

export default ApparatusTerminal
