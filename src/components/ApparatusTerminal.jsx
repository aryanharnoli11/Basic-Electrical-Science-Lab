const polarityText = {
  minus: 'negative',
  plus: 'positive',
}

const ApparatusTerminal = ({ number, owner, polarity, variant }) => {
  const terminalId = `${number}-endpoint`
  const terminalPolarity = polarityText[polarity] ?? polarity

  return (
    <>
      <span
        className={[
          'connection-terminal',
          'connection-terminal--apparatus',
          'endpoint',
          `endpoint-${number}`,
          `connection-terminal--${variant}`,
          `connection-terminal--${variant}-${polarity}`,
          `connection-terminal--endpoint-${number}`,
        ].join(' ')}
        data-polarity={polarity}
        data-terminal-id={terminalId}
        aria-label={`${owner} ${terminalPolarity} terminal ${number}`}
      />
      <span
        id={`label-${number}`}
        className={[
          'terminal-number-label',
          'terminal-number-label--apparatus',
          'endpoint-label',
          `endpoint-label-${number}`,
          `terminal-number-label--${variant}-${polarity}`,
          `terminal-number-label--endpoint-${number}`,
        ].join(' ')}
        data-terminal-id={terminalId}
        role="button"
        tabIndex={0}
      >
        {number}
      </span>
    </>
  )
}

export default ApparatusTerminal
