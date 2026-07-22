import { useEffect, useRef, useState } from 'react'
import SectionCard from './SectionCard.jsx'
import {
  AddIcon,
  AiGuide,
  AutoConnectIcon,
  ButtonIcon,
  CheckIcon,
  CloseIcon,
  PlotIcon,
  PrintIcon,
  ResetIcon,
} from './Icons.jsx'

const buttons = [
  {
    id: 'instruction-button',
    label: 'INSTRUCTIONS',
    tone: 'action-button--gold',
    Icon: ButtonIcon,
    opensInstructions: true,
  },
  {
    id: 'ai-guide-button',
    label: 'AI GUIDE',
    tone: 'action-button--cyan',
    Icon: AiGuide,
    handlerName: 'onAiGuide',
  },
  {
    id: 'check-button',
    label: 'CHECK',
    tone: 'action-button--green',
    Icon: CheckIcon,
    handlerName: 'onCheck',
  },
  {
    id: 'auto-connect-button',
    label: 'AUTO CONNECT',
    tone: 'action-button--teal',
    Icon: AutoConnectIcon,
    handlerName: 'onAutoConnect',
  },
  {
    id: 'add-reading-button',
    label: 'ADD',
    tone: 'action-button--blue',
    Icon: AddIcon,
    handlerName: 'onAdd',
  },
  {
    id: 'plot-button',
    label: 'PLOT',
    tone: 'action-button--orange',
    Icon: PlotIcon,
    handlerName: 'onPlot',
  },
  {
    id: 'reset-button',
    label: 'RESET',
    tone: 'action-button--red',
    Icon: ResetIcon,
    handlerName: 'onReset',
  },
  {
    id: 'print-button',
    label: 'PRINT',
    tone: 'action-button--purple',
    Icon: PrintIcon,
    handlerName: 'onPrint',
  },
  
 
]

const connectionGroups = [
  {
    id: 'connection-1-11',
    label: 'Connection 1:',
    pairs: ['1-11'],
  },
  {
    id: 'connection-2-12',
    label: 'Connection 2:',
    pairs: ['2-12'],
  },
  {
    id: 'connection-3-13',
    label: 'Connection 3:',
    pairs: ['3-13'],
  },
  {
    id: 'connection-4-14',
    label: 'Connection 4:',
    pairs: ['4-14'],
  },
  {
    id: 'connection-3-5',
    label: 'Connection 5:',
    pairs: ['3-5'],
  },
  {
    id: 'connection-6-7',
    label: 'Connection 6:',
    pairs: ['6-7'],
  },
  {
    id: 'connection-7-9',
    label: 'Connection 7:',
    pairs: ['7-9'],
  },
  {
    id: 'connection-8-15',
    label: 'Connection 8:',
    pairs: ['8-15'],
  },
  {
    id: 'connection-10-17',
    label: 'Connection 9:',
    pairs: ['10-17'],
  },
  {
    id: 'connection-14-17',
    label: 'Connection 10:',
    pairs: ['14-17'],
  },
  {
    id: 'connection-16-19',
    label: 'Connection 11:',
    pairs: ['16-19'],
  },
  {
    id: 'connection-18-20',
    label: 'Connection 12:',
    pairs: ['18-20'],
  },
  {
    id: 'connection-19-21',
    label: 'Connection 13:',
    pairs: ['19-21'],
  },
  {
    id: 'connection-22-23',
    label: 'Connection 14:',
    pairs: ['22-23'],
  },
  {
    id: 'connection-20-24',
    label: 'Connection 15:',
    pairs: ['20-24'],
  },
]

const instructionSteps = [
  {
    id: 'connections',
    title: 'STEP 1:',
    content: 'Make the required terminal connections in the sequence below:',
    groups: connectionGroups,
  },
  {
    id: 'check',
    title: 'STEP 2:',
    content: 'Click CHECK to verify the wiring. If any connection is invalid or missing, correct the highlighted wiring and check again.',
  },
  {
    id: 'mcb',
    title: 'STEP 3:',
    content: 'After the connections are correct, turn ON the MCB.',
  },
  {
    id: 'voltage',
    title: 'STEP 4:',
    content: 'Click the autotransformer knob once. It automatically sets the primary voltage to 230 V.',
  },
  {
    id: 'noLoadReading',
    title: 'STEP 5:',
    content: 'Click ADD to record the no-load reading in the observation table.',
  },
  {
    id: 'load1',
    title: 'STEP 6:',
    content: 'Turn ON lamp-load switch 1, then click ADD to record the first load reading.',
  },
  {
    id: 'load2',
    title: 'STEP 7:',
    content: 'Turn ON lamp-load switch 2, then click ADD to record the second load reading.',
  },
  {
    id: 'load3',
    title: 'STEP 8:',
    content: 'Turn ON lamp-load switch 3, then click ADD to record the third load reading.',
  },
  {
    id: 'load4',
    title: 'STEP 9:',
    content: 'Turn ON lamp-load switch 4, then click ADD to record the fourth load reading.',
  },
  {
    id: 'plot',
    title: 'STEP 10:',
    content: 'Click PLOT to generate the efficiency and voltage-regulation graphs.',
  },
  {
    id: 'report',
    title: 'STEP 11:',
    content: 'Click Generate Report after plotting the graphs to create the experiment report.',
  },
  {
    id: 'finish',
    title: 'STEP 12:',
    content: 'Use PRINT to print the webpage, or RESET to clear the simulation and start again.',
  },
]

const ActionButtons = ({
  activeConnectionPair,
  activeButtons = {},
  activeInstructionStepId = 'connections',
  disabledButtons = {},
  onAdd,
  onAiGuide,
  onCheck,
  onPlot,
  onPrint,
  onReset,
  onAutoConnect,
}) => {
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const activeInstructionRef = useRef(null)
  const handlers = {
    onAdd,
    onCheck,
    onPlot,
    onPrint,
    onReset,
    onAutoConnect,
    onAiGuide,
  }

  useEffect(() => {
    if (!instructionsOpen || !activeInstructionRef.current) {
      return
    }

    activeInstructionRef.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [activeConnectionPair, activeInstructionStepId, instructionsOpen])

  return (
    <SectionCard className="action-buttons-card h-[228px]" icon="buttons" id="action-buttons-panel" title="ACTION BUTTONS">
      <div className="action-buttons__grid">
        {buttons.map(({ id, label, tone, Icon, handlerName, opensInstructions }) => {
          const handler = handlers[handlerName]
          const isActive = !opensInstructions && Boolean(activeButtons[handlerName])
          const isDisabled = !opensInstructions && (!handler || disabledButtons[handlerName])
          const buttonProps = opensInstructions
            ? {
                'aria-controls': 'experiment-instructions-panel',
                'aria-expanded': instructionsOpen,
                onClick: () => setInstructionsOpen((current) => !current),
              }
            : {
                'aria-pressed': handlerName === 'onAiGuide' ? isActive : undefined,
                onClick: handler,
              }

          return (
            <button
              id={id}
              key={label}
              type="button"
              className={`action-button ${tone} ${isActive ? 'action-button--active' : ''}`}
              disabled={isDisabled}
              {...buttonProps}
            >
              <Icon />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {instructionsOpen ? (
        <div
          className="action-instructions-panel"
          id="experiment-instructions-panel"
          role="region"
          aria-labelledby="experiment-instructions-title"
        >
          <div className="action-instructions-panel__header">
            <h3 id="experiment-instructions-title">Instructions</h3>
            <button
              type="button"
              className="action-instructions-panel__close"
              aria-label="Close instructions"
              onClick={() => setInstructionsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="action-instructions-panel__body">
            <ol className="action-instructions-panel__steps">
              {instructionSteps.map((step) => {
                const isActiveStep = step.id === activeInstructionStepId
                const hasActiveSubstep = Boolean(
                  step.groups?.some((group) => (
                    isActiveStep
                    && group.pairs.includes(activeConnectionPair)
                  )),
                )

                return (
                  <li
                    aria-current={isActiveStep ? 'step' : undefined}
                    className={`action-instructions-panel__step ${isActiveStep && !hasActiveSubstep ? 'action-instructions-panel__step--active' : ''}`}
                    key={step.id}
                    ref={isActiveStep && !hasActiveSubstep ? activeInstructionRef : undefined}
                  >
                    <strong>{step.title}</strong> {step.content}
                    {step.groups ? (
                      <ul className="action-instructions-panel__substeps">
                        {step.groups.map((group) => {
                          const isActiveSubstep = (
                            isActiveStep
                            && group.pairs.includes(activeConnectionPair)
                          )

                          return (
                            <li
                              aria-current={isActiveSubstep ? 'step' : undefined}
                              className={`action-instructions-panel__substep ${isActiveSubstep ? 'action-instructions-panel__substep--active' : ''}`}
                              key={group.id}
                              ref={isActiveSubstep ? activeInstructionRef : undefined}
                            >
                              <strong>{group.label}</strong>{' '}
                              <code>({group.pairs.join(', ')})</code>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
              <li className="action-instructions-panel__note">
                <strong>NOTE:</strong> Click a terminal number label to delete the connection attached to that node before the MCB is turned ON.
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export default ActionButtons
