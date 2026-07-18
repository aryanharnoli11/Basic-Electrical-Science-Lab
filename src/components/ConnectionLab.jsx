import { useCallback, useEffect, useRef } from 'react'

import EquipmentPanel from './EquipmentPanel.jsx'
import {
  DEFAULT_WIRE_CONNECTOR_OPTIONS,
  WIRE_CONNECTOR_TYPE,
  WIRE_CURVINESS_CONFIG_SIGNATURE,
  addAllEndpoints,
  applyAllWireCurviness,
  autoConnectDefaultCircuit,
  deleteConnectionsForTerminal,
  hasConnectionBetween,
  isWrongConnection,
  resolveJsPlumb,
  syncWireAnchors,
  updateTerminalConnectionStates,
  validateOldExperimentConnections,
  wireHoverPaintStyles,
  wirePaintStyles,
} from '../utils/jsPlumbWiring.js'

const ConnectionLab = ({
  activeLoadLevel,
  activeGuideConnection,
  autoConnectRequest,
  checkRequest,
  highlightedTerminalIds = [],
  nextEnabledLoadLevel,
  onCheckConnections,
  onAutoConnectReady,
  onConnectionRemovalBlocked,
  onGuideConnectionComplete,
  onLoadLevelChange,
  onValidateConnectionsReady,
  onWiringChange,
  onWrongConnectionMade,
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
  const activeGuideConnectionRef = useRef(activeGuideConnection)
  const onAutoConnectReadyRef = useRef(onAutoConnectReady)
  const onConnectionRemovalBlockedRef = useRef(onConnectionRemovalBlocked)
  const onGuideConnectionCompleteRef = useRef(onGuideConnectionComplete)
  const onValidateConnectionsReadyRef = useRef(onValidateConnectionsReady)
  const onWiringChangeRef = useRef(onWiringChange)
  const onWrongConnectionMadeRef = useRef(onWrongConnectionMade)
  const powerOnRef = useRef(powerOn)
  const wireCurvinessConfigSignatureRef = useRef(WIRE_CURVINESS_CONFIG_SIGNATURE)

  const notifyGuideConnectionIfMatched = useCallback(() => {
    const instance = instanceRef.current
    const guideConnection = activeGuideConnectionRef.current

    if (!instance || !guideConnection?.length) {
      return
    }

    if (hasConnectionBetween(instance, guideConnection[0], guideConnection[1])) {
      onGuideConnectionCompleteRef.current?.(guideConnection)
    }
  }, [])

  const notifyWiringChange = useCallback(() => {
    const instance = instanceRef.current

    onWiringChangeRef.current?.(
      instance ? validateOldExperimentConnections(instance) : null,
    )
  }, [])

  useEffect(() => {
    onAutoConnectReadyRef.current = onAutoConnectReady
  }, [onAutoConnectReady])

  useEffect(() => {
    onConnectionRemovalBlockedRef.current = onConnectionRemovalBlocked
  }, [onConnectionRemovalBlocked])

  useEffect(() => {
    onGuideConnectionCompleteRef.current = onGuideConnectionComplete
  }, [onGuideConnectionComplete])

  useEffect(() => {
    onValidateConnectionsReadyRef.current = onValidateConnectionsReady
  }, [onValidateConnectionsReady])

  useEffect(() => {
    onWiringChangeRef.current = onWiringChange
  }, [onWiringChange])

  useEffect(() => {
    onWrongConnectionMadeRef.current = onWrongConnectionMade
  }, [onWrongConnectionMade])

  useEffect(() => {
    activeGuideConnectionRef.current = activeGuideConnection

    window.requestAnimationFrame(notifyGuideConnectionIfMatched)
  }, [activeGuideConnection, notifyGuideConnectionIfMatched])

  useEffect(() => {
    powerOnRef.current = powerOn
  }, [powerOn])

  useEffect(() => {
    const labElement = labRef.current

    if (!labElement) {
      return undefined
    }

    const highlightedIds = new Set(highlightedTerminalIds)
    const terminalElements = Array.from(
      labElement.querySelectorAll(
        '.connection-terminal[data-terminal-id], .terminal-number-label[data-terminal-id], .wire-anchor[data-terminal-id]',
      ),
    )

    terminalElements.forEach((terminalElement) => {
      const isHighlighted = highlightedIds.has(terminalElement.dataset.terminalId)

      terminalElement.classList.toggle('simulation-guide-highlight', isHighlighted)
    })

    return () => {
      terminalElements.forEach((terminalElement) => {
        terminalElement.classList.remove('simulation-guide-highlight')
      })
    }
  }, [highlightedTerminalIds])

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
        Connector: [
          WIRE_CONNECTOR_TYPE,
          DEFAULT_WIRE_CONNECTOR_OPTIONS,
        ],
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
        notifyWiringChange()
        notifyGuideConnectionIfMatched()
      }

      const autoConnectCircuit = () => {
        syncWireAnchors(labRef.current, activeInstance)
        autoConnectDefaultCircuit(activeInstance)
        activeInstance.repaintEverything?.()
        updateTerminalConnectionStates(activeInstance)
        notifyWiringChange()
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
      activeInstance.bind('connection', (connectionInfo) => {
        refreshWiring()

        const connection = connectionInfo?.connection ?? connectionInfo

        if (isWrongConnection(activeInstance, connection)) {
          onWrongConnectionMadeRef.current?.()
        }
      })
      activeInstance.bind('connectionDetached', refreshWiring)
      activeInstance.bind('connectionMoved', refreshWiring)

      syncWireAnchors(labRef.current)
      addAllEndpoints(activeInstance)
      instanceRef.current = activeInstance
      onAutoConnectReadyRef.current?.(autoConnectCircuit)
      onValidateConnectionsReadyRef.current?.(() => validateOldExperimentConnections(activeInstance))

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
      onAutoConnectReadyRef.current?.(null)
      onValidateConnectionsReadyRef.current?.(null)
      onWiringChangeRef.current?.(null)
    }
  }, [notifyGuideConnectionIfMatched, notifyWiringChange, resetRequest])

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
      notifyWiringChange()
    })
  }, [autoConnectRequest, notifyWiringChange])

  useEffect(() => {
    if (wireCurvinessConfigSignatureRef.current === WIRE_CURVINESS_CONFIG_SIGNATURE) {
      return
    }

    const instance = instanceRef.current

    if (!instance) {
      return
    }

    wireCurvinessConfigSignatureRef.current = WIRE_CURVINESS_CONFIG_SIGNATURE

    window.requestAnimationFrame(() => {
      applyAllWireCurviness(instance)
      instance.repaintEverything?.()
    })
  })

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance || checkRequest === 0) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      onCheckConnections(validateOldExperimentConnections(instance))
    })

    return () => window.cancelAnimationFrame(frameId)
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
      notifyWiringChange()
    })
  }, [notifyWiringChange, scale])

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
        notifyWiringChange()
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
  }, [notifyWiringChange])

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
