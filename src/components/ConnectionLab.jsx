import { useEffect, useRef } from 'react'

import EquipmentPanel from './EquipmentPanel.jsx'
import {
  DEFAULT_WIRE_CURVINESS,
  addAllEndpoints,
  applyAllWireCurviness,
  autoConnectDefaultCircuit,
  deleteConnectionsForTerminal,
  resolveJsPlumb,
  syncWireAnchors,
  updateTerminalConnectionStates,
  validateOldExperimentConnections,
  wireHoverPaintStyles,
  wirePaintStyles,
} from '../utils/jsPlumbWiring.js'

const ConnectionLab = ({
  activeLoadLevel,
  autoConnectRequest,
  checkRequest,
  nextEnabledLoadLevel,
  onCheckConnections,
  onConnectionRemovalBlocked,
  onLoadLevelChange,
  powerOn,
  readings,
  resetRequest,
  scale,
  onTogglePower,
  onVoltageControlBlocked,
  setVoltage,
  voltage,
}) => {
  const labRef = useRef(null)
  const instanceRef = useRef(null)
  const onConnectionRemovalBlockedRef = useRef(onConnectionRemovalBlocked)
  const powerOnRef = useRef(powerOn)

  useEffect(() => {
    onConnectionRemovalBlockedRef.current = onConnectionRemovalBlocked
  }, [onConnectionRemovalBlocked])

  useEffect(() => {
    powerOnRef.current = powerOn
  }, [powerOn])

  useEffect(() => {
    let disposed = false
    let activeInstance = null
    let cleanupLayoutListeners = () => {}

    const setupJsPlumb = (jsPlumb) => {
      if (disposed || !labRef.current) {
        return
      }

      activeInstance = jsPlumb.getInstance({
        ConnectionsDetachable: true,
        Connector: ['Bezier', { curviness: DEFAULT_WIRE_CURVINESS }],
        Container: labRef.current,
        Endpoint: ['Dot', { radius: 5 }],
      })

      activeInstance.setContainer?.(labRef.current)
      activeInstance.registerConnectionType?.('positive', {
        connectorHoverStyle: wireHoverPaintStyles.positive,
        connectorStyle: wirePaintStyles.positive,
        paintStyle: wirePaintStyles.positive,
        hoverPaintStyle: wireHoverPaintStyles.positive,
      })
      activeInstance.registerConnectionType?.('negative', {
        connectorHoverStyle: wireHoverPaintStyles.negative,
        connectorStyle: wirePaintStyles.negative,
        paintStyle: wirePaintStyles.negative,
        hoverPaintStyle: wireHoverPaintStyles.negative,
      })

      const refreshWiring = () => {
        if (!activeInstance || !labRef.current) {
          return
        }

        syncWireAnchors(labRef.current, activeInstance)
        applyAllWireCurviness(activeInstance)
        activeInstance.repaintEverything?.()
        updateTerminalConnectionStates(activeInstance)
      }

      activeInstance.bind('beforeDrop', ({ sourceId, targetId }) => {
        return sourceId !== targetId
      })
      activeInstance.bind('beforeDetach', () => {
        if (!powerOnRef.current) {
          return true
        }

        onConnectionRemovalBlockedRef.current?.()
        return false
      })
      activeInstance.bind('connection', refreshWiring)
      activeInstance.bind('connectionDetached', refreshWiring)
      activeInstance.bind('connectionMoved', refreshWiring)

      syncWireAnchors(labRef.current)
      addAllEndpoints(activeInstance)
      instanceRef.current = activeInstance

      const scheduleRefresh = () => {
        window.requestAnimationFrame(refreshWiring)
      }

      const imageElements = Array.from(labRef.current.querySelectorAll('img'))

      imageElements.forEach((imageElement) => {
        imageElement.addEventListener('load', scheduleRefresh)
      })

      cleanupLayoutListeners = () => {
        imageElements.forEach((imageElement) => {
          imageElement.removeEventListener('load', scheduleRefresh)
        })
      }

      window.requestAnimationFrame(() => {
        refreshWiring()
        window.requestAnimationFrame(refreshWiring)
      })
    }

    import('jsplumb').then((module) => {
      const jsPlumb = resolveJsPlumb(module)

      if (!jsPlumb?.getInstance) {
        return
      }

      if (typeof jsPlumb.ready === 'function') {
        jsPlumb.ready(() => setupJsPlumb(jsPlumb))
        return
      }

      setupJsPlumb(jsPlumb)
    })

    return () => {
      disposed = true

      if (instanceRef.current === activeInstance) {
        instanceRef.current = null
      }

      powerOnRef.current = false
      cleanupLayoutListeners()
      activeInstance?.deleteEveryConnection?.()
      activeInstance?.deleteEveryEndpoint?.()
      activeInstance?.reset?.()
    }
  }, [resetRequest])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance || autoConnectRequest === 0) {
      return
    }

    window.requestAnimationFrame(() => {
      syncWireAnchors(labRef.current, instance)
      autoConnectDefaultCircuit(instance)
      instance.repaintEverything?.()
      updateTerminalConnectionStates(instance)
    })
  }, [autoConnectRequest])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance || checkRequest === 0) {
      return
    }

    onCheckConnections(validateOldExperimentConnections(instance))
  }, [checkRequest, onCheckConnections])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance) {
      return
    }

    window.requestAnimationFrame(() => {
      syncWireAnchors(labRef.current, instance)
      instance.repaintEverything?.()
      updateTerminalConnectionStates(instance)
    })
  }, [scale])

  useEffect(() => {
    const labElement = labRef.current

    if (!labElement) {
      return undefined
    }

    const removeTerminalConnection = (terminalId) => {
      const instance = instanceRef.current

      if (!instance || !terminalId) {
        return
      }

      if (powerOnRef.current) {
        onConnectionRemovalBlockedRef.current?.()
        return
      }

      const deletedCount = deleteConnectionsForTerminal(instance, terminalId)

      if (deletedCount > 0) {
        syncWireAnchors(labRef.current, instance)
        instance.repaintEverything?.()
        updateTerminalConnectionStates(instance)
      }
    }

    const getTerminalLabel = (event) => {
      const directLabel = event.target.closest?.('.terminal-number-label[data-terminal-id]')

      if (directLabel) {
        return directLabel
      }

      return Array.from(labElement.querySelectorAll('.terminal-number-label[data-terminal-id]'))
        .find((label) => {
          const rect = label.getBoundingClientRect()

          return (
            event.clientX >= rect.left
            && event.clientX <= rect.right
            && event.clientY >= rect.top
            && event.clientY <= rect.bottom
          )
        })
    }

    const handleLabelClick = (event) => {
      const label = getTerminalLabel(event)

      if (!label || !labElement.contains(label)) {
        return
      }

      removeTerminalConnection(label.dataset.terminalId)
    }

    const handleLabelKeyDown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      const label = getTerminalLabel(event)

      if (!label || !labElement.contains(label)) {
        return
      }

      event.preventDefault()
      removeTerminalConnection(label.dataset.terminalId)
    }

    labElement.addEventListener('click', handleLabelClick)
    labElement.addEventListener('keydown', handleLabelKeyDown)

    return () => {
      labElement.removeEventListener('click', handleLabelClick)
      labElement.removeEventListener('keydown', handleLabelKeyDown)
    }
  }, [])

  return (
    <div className="connection-lab" id="connection-lab" ref={labRef} aria-label="Experiment apparatus area">
      <EquipmentPanel
        activeLoadLevel={activeLoadLevel}
        nextEnabledLoadLevel={nextEnabledLoadLevel}
        onLoadLevelChange={onLoadLevelChange}
        onTogglePower={onTogglePower}
        onVoltageControlBlocked={onVoltageControlBlocked}
        powerOn={powerOn}
        readings={readings}
        setVoltage={setVoltage}
        voltage={voltage}
      />
    </div>
  )
}

export default ConnectionLab
