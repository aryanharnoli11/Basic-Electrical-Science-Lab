import { useState } from 'react'
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
    label: 'INSTRUCTION',
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
    pairs: ['1-11'],
  },
  {
    pairs: ['2-12'],
  },
  {
    pairs: ['3-13'],
  },
  {
    pairs: ['4-14'],
  },
  {
    pairs: ['3-5'],
  },
  {
    pairs: ['6-7'],
  },
  {
    pairs: ['7-9'],
  },
  {
    pairs: ['8-15'],
  },
  {
    pairs: ['10-17'],
  },
  {
    pairs: ['14-17'],
  },
  {
    pairs: ['16-19'],
  },
  {
    pairs: ['18-20'],
  },
  {
    pairs: ['19-21'],
  },
  {
    pairs: ['22-23'],
  },
  {
    pairs: ['20-24'],
  },
]

const instructionSteps = [
  {
    title: 'STEP 1:',
    content: 'Make connections as per the instructions given below:',
    groups: connectionGroups,
  },
  {
    title: 'STEP 2:',
    content: 'Click CHECK to verify the wiring. If any connection is invalid or missing, correct the highlighted wiring and check again.',
  },
  {
    title: 'STEP 3:',
    content: 'After the connections are correct, turn ON the MCB.',
  },
  {
    title: 'STEP 4:',
    content: 'Click the autotransformer knob once. It automatically sets the primary voltage to 230 V.',
  },
  {
    title: 'STEP 5:',
    content: 'Click ADD to record the no-load reading in the observation table.',
  },
  {
    title: 'STEP 6:',
    content: 'Turn ON lamp-load switch 1, then click ADD to record the first load reading.',
  },
  {
    title: 'STEP 7:',
    content: 'Turn ON lamp-load switch 2, then click ADD to record the second load reading.',
  },
  {
    title: 'STEP 8:',
    content: 'Turn ON lamp-load switch 3, then click ADD to record the third load reading.',
  },
  {
    title: 'STEP 9:',
    content: 'Turn ON lamp-load switch 4, then click ADD to record the fourth load reading.',
  },
  {
    title: 'STEP 10:',
    content: 'Click PLOT to generate the efficiency and voltage-regulation graphs.',
  },
  {
    title: 'STEP 11:',
    content: 'Click Generate Report after plotting the graphs to create the experiment report.',
  },
  {
    title: 'STEP 12:',
    content: 'Use PRINT to print the webpage, or RESET to clear the simulation and start again.',
  },
]

const ActionButtons = ({
  activeButtons = {},
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
  const handlers = {
    onAdd,
    onCheck,
    onPlot,
    onPrint,
    onReset,
    onAutoConnect,
    onAiGuide,
  }

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
                title: handlerName === 'onAiGuide' && isActive ? 'Click to stop narration' : undefined,
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
              {instructionSteps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong> {step.content}
                  {step.groups ? (
                    <ul className="action-instructions-panel__substeps">
                      {step.groups.map((group) => (
                        <li key={group.label}>
                          <strong>{group.label}</strong>{' '}
                          <code>({group.pairs.join(', ')})</code>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
              <li>
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
