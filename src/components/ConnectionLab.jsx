import { useEffect, useRef } from 'react'

import EquipmentPanel from './EquipmentPanel.jsx'
import {
  addAllEndpoints,
  resolveJsPlumb,
  wireHoverPaintStyles,
  wirePaintStyles,
} from '../utils/jsPlumbWiring.js'

const getTerminalPolarity = (terminalId) => (
  document.getElementById(terminalId)?.dataset.polarity
)

const ConnectionLab = ({
  autoConnectRequest,
  checkRequest,
  onCheckConnections,
  powerOn,
  readings,
  resetRequest,
  scale,
  onTogglePower,
  setVoltage,
  voltage,
}) => {
  const labRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    let disposed = false
    let activeInstance = null

    const setupJsPlumb = (jsPlumb) => {
      if (disposed || !labRef.current) {
        return
      }

      activeInstance = jsPlumb.getInstance({
        ConnectionsDetachable: true,
        Connector: ['Bezier', { curviness: 48 }],
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

      activeInstance.bind('beforeDrop', ({ sourceId, targetId }) => {
        if (sourceId === targetId) {
          return false
        }

        const sourcePolarity = getTerminalPolarity(sourceId)
        const targetPolarity = getTerminalPolarity(targetId)

        return Boolean(sourcePolarity && targetPolarity && sourcePolarity === targetPolarity)
      })

      addAllEndpoints(activeInstance)
      instanceRef.current = activeInstance

      window.requestAnimationFrame(() => {
        activeInstance?.repaintEverything?.()
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

    instance.repaintEverything?.()
  }, [autoConnectRequest])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance || checkRequest === 0) {
      return
    }

    const connections = typeof instance.getAllConnections === 'function'
      ? instance.getAllConnections()
      : instance.getConnections?.() ?? []

    onCheckConnections({
      isCorrect: false,
      matchedCount: 0,
      totalConnections: connections.length,
    })
  }, [checkRequest, onCheckConnections])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance) {
      return
    }

    window.requestAnimationFrame(() => {
      instance.repaintEverything?.()
    })
  }, [scale])

  return (
    <div className="connection-lab" id="connection-lab" ref={labRef} aria-label="Experiment apparatus area">
      <EquipmentPanel
        onTogglePower={onTogglePower}
        powerOn={powerOn}
        readings={readings}
        setVoltage={setVoltage}
        voltage={voltage}
      />
    </div>
  )
}

export default ConnectionLab
