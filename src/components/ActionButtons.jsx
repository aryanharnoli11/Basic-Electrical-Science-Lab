import SectionCard from './SectionCard.jsx'
import {
  AddIcon,
  AiGuide,
  AutoConnectIcon,
  CheckIcon,
  PlotIcon,
  PrintIcon,
  ResetIcon,
} from './Icons.jsx'

const buttons = [
  {
    id: 'check-button',
    label: 'CHECK',
    tone: 'action-button--green',
    Icon: CheckIcon,
    handlerName: 'onCheck',
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
  {
    id: 'auto-connect-button',
    label: 'AUTO CONNECT',
    tone: 'action-button--teal',
    Icon: AutoConnectIcon,
    handlerName: 'onAutoConnect',
  },
  {
    id: 'ai-guide-button',
    label: 'AI GUIDE',
    tone: 'action-button--cyan',
    Icon: AiGuide,
    handlerName: 'onAiGuide',
  },
]

const ActionButtons = ({
  disabledButtons = {},
  onAdd,
  onCheck,
  onPlot,
  onPrint,
  onReset,
  onAutoConnect,
  onAiGuide,
}) => {
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
    <SectionCard className="h-[176px]" icon="buttons" id="action-buttons-panel" title="ACTION BUTTONS">
      <div className="action-buttons__grid">
        {buttons.map(({ id, label, tone, Icon, handlerName }) => {
          const handler = handlers[handlerName]
          const isDisabled = !handler || disabledButtons[handlerName]

          return (
            <button
              id={id}
              key={label}
              type="button"
              className={`action-button ${tone}`}
              disabled={isDisabled}
              onClick={handler}
            >
              <Icon />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

export default ActionButtons
