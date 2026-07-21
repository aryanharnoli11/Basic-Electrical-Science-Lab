export const POSITIVE_TERMINALS = [
  '1-endpoint',
  '3-endpoint',
  '5-endpoint',
  '7-endpoint',
  '9-endpoint',
  '11-endpoint',
  '13-endpoint',
  '15-endpoint',
  '16-endpoint',
  '19-endpoint',
  '21-endpoint',
  '23-endpoint',
]

export const NEGATIVE_TERMINALS = [
  '2-endpoint',
  '4-endpoint',
  '6-endpoint',
  '8-endpoint',
  '10-endpoint',
  '12-endpoint',
  '14-endpoint',
  '17-endpoint',
  '18-endpoint',
  '20-endpoint',
  '22-endpoint',
  '24-endpoint',
]

export const CIRCUIT_POSITIVE_TERMINALS = []

export const CIRCUIT_NEGATIVE_TERMINALS = []

const WIRE_ANCHOR_SIZE = 28
export const WIRE_CONNECTOR_TYPE = 'Bezier'
export const DEFAULT_WIRE_CURVINESS = 135
export const WIRE_MARGIN = 0
export const WIRE_PROXIMITY_LIMIT = 0
export const WIRE_ANCHOR = [0.5, 0.5, 0, 1]
export const DEFAULT_WIRE_CONNECTOR_OPTIONS = {
  curviness: DEFAULT_WIRE_CURVINESS,
  margin: WIRE_MARGIN,
  proximityLimit: WIRE_PROXIMITY_LIMIT,
}

export const REQUIRED_CONNECTIONS = [
  ['1-endpoint', '11-endpoint'],
  ['2-endpoint', '12-endpoint'],
  ['3-endpoint', '13-endpoint'],
  ['4-endpoint', '14-endpoint'],
  ['3-endpoint', '5-endpoint'],
  ['6-endpoint', '7-endpoint'],
  ['7-endpoint', '9-endpoint'],
  ['8-endpoint', '15-endpoint'],
  ['10-endpoint', '17-endpoint'],
  ['14-endpoint', '17-endpoint'],
  ['16-endpoint', '19-endpoint'],
  ['18-endpoint', '20-endpoint'],
  ['19-endpoint', '21-endpoint'],
  ['22-endpoint', '23-endpoint'],
  ['20-endpoint', '24-endpoint'],
]

export const VALID_CONNECTION_SEQUENCE = REQUIRED_CONNECTIONS.flat()

export const DEFAULT_AUTO_CONNECTIONS = REQUIRED_CONNECTIONS

// Edit these values to tune each wire's U-shaped sag. Higher values make deeper U bends.
export const WIRE_CURVINESS_BY_CONNECTION = {
  '1-11': 35,
  '2-12': 45,
  '3-13': 35,
  '4-14': 45,
  '3-5': 60,
  '6-7': 60,
  '7-9': 70,
  '8-15': 70,
  '10-17': 70,
  '14-17': 65,
  '16-19': 75,
  '18-20': 75,
  '19-21': 65,
  '22-23': 75,
  '20-24': 75,
}

export const WIRE_CURVINESS_CONFIG_SIGNATURE = JSON.stringify({
  connectorOptions: DEFAULT_WIRE_CONNECTOR_OPTIONS,
  connectorType: WIRE_CONNECTOR_TYPE,
  curvinessByConnection: WIRE_CURVINESS_BY_CONNECTION,
})

export const DEFAULT_AMMETER_CURRENT_KEYS = {
  A1: 'i1',
  A2: 'i2',
}

const AMMETER_BRANCH_CONNECTIONS = {
  A1: [
    {
      currentKey: 'i1',
      negativeTerminal: '6-endpoint',
      positiveTerminal: '5-endpoint',
      circuitNegativeTerminal: '18-endpoint',
      circuitPositiveTerminal: '16-endpoint',
    },
  ],
  A2: [
    {
      currentKey: 'i2',
      negativeTerminal: '22-endpoint',
      positiveTerminal: '21-endpoint',
      circuitNegativeTerminal: '18-endpoint',
      circuitPositiveTerminal: '16-endpoint',
    },
  ], 
}

export const resolveJsPlumb = (module) => (
  module?.jsPlumb
  || module?.default?.jsPlumb
  || module?.default
  || window.jsPlumb
)

const getAllConnections = (instance) => {
  if (!instance) return []

  if (typeof instance.getAllConnections === 'function') {
    return instance.getAllConnections()
  }

  if (typeof instance.getConnections === 'function') {
    return instance.getConnections()
  }

  return []
}

const getAllTerminalIds = () => [
  ...POSITIVE_TERMINALS,
  ...NEGATIVE_TERMINALS,
  ...CIRCUIT_POSITIVE_TERMINALS,
  ...CIRCUIT_NEGATIVE_TERMINALS,
]

const getVisualTerminalElement = (terminalId) => (
  document.querySelector(`.connection-terminal[data-terminal-id="${terminalId}"]`)
)

const getWireAnchorLayer = (containerElement) => {
  let layer = containerElement.querySelector('.wire-anchor-layer')

  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'wire-anchor-layer'
    layer.setAttribute('aria-hidden', 'true')
    containerElement.appendChild(layer)
  }

  return layer
}

export const syncWireAnchors = (
  containerElement = document.getElementById('connection-lab'),
  instance,
) => {
  if (!containerElement) {
    return []
  }

  const layer = getWireAnchorLayer(containerElement)
  const containerRect = containerElement.getBoundingClientRect()
  const scaleX = containerElement.offsetWidth && containerRect.width
    ? containerRect.width / containerElement.offsetWidth
    : 1
  const scaleY = containerElement.offsetHeight && containerRect.height
    ? containerRect.height / containerElement.offsetHeight
    : 1

  return getAllTerminalIds().map((terminalId) => {
    const visualElement = getVisualTerminalElement(terminalId)

    if (!visualElement) {
      return null
    }

    let anchorElement = document.getElementById(terminalId)

    if (!anchorElement || anchorElement.parentElement !== layer) {
      anchorElement = document.createElement('span')
      anchorElement.id = terminalId
      anchorElement.className = [
        'wire-anchor',
        `wire-anchor-${getTerminalNumber(terminalId)}`,
      ].join(' ')
      anchorElement.dataset.terminalId = terminalId
      layer.appendChild(anchorElement)
    }

    anchorElement.dataset.polarity = visualElement.dataset.polarity ?? ''
    anchorElement.removeAttribute('title')

    const visualRect = visualElement.getBoundingClientRect()
    const centerX = (
      visualRect.left
      + visualRect.width / 2
      - containerRect.left
    ) / scaleX
    const centerY = (
      visualRect.top
      + visualRect.height / 2
      - containerRect.top
    ) / scaleY

    anchorElement.style.left = `${centerX - WIRE_ANCHOR_SIZE / 2}px`
    anchorElement.style.top = `${centerY - WIRE_ANCHOR_SIZE / 2}px`

    instance?.revalidate?.(anchorElement)

    return anchorElement
  }).filter(Boolean)
}

export const updateTerminalConnectionStates = (instance) => {
  const connectedTerminalIds = new Set()

  getAllConnections(instance).forEach((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    if (sourceId) connectedTerminalIds.add(sourceId)
    if (targetId) connectedTerminalIds.add(targetId)
  })

  getAllTerminalIds().forEach((terminalId) => {
    getVisualTerminalElement(terminalId)?.classList.toggle(
      'jtk-connected',
      connectedTerminalIds.has(terminalId),
    )
  })
}

export const deleteConnectionsForTerminal = (instance, terminalId) => {
  const matchingConnections = getAllConnections(instance).filter((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    return sourceId === terminalId || targetId === terminalId
  })

  matchingConnections.forEach((connection) => {
    if (typeof instance.deleteConnection === 'function') {
      instance.deleteConnection(connection)
      return
    }

    connection.detach?.()
  })

  return matchingConnections.length
}

const isNegativeTerminal = (terminalId) => (
  NEGATIVE_TERMINALS.includes(terminalId)
  || CIRCUIT_NEGATIVE_TERMINALS.includes(terminalId)
)

const terminalPaintStyles = {
  positive: {
    fill: '#0047b8',
    outlineStroke: '#f8fbff',
    outlineWidth: 2,
    stroke: '#05215f',
    strokeWidth: 1.4,
  },
  negative: {
    fill: '#b91c1c',
    outlineStroke: '#fff8f6',
    outlineWidth: 2,
    stroke: '#65100e',
    strokeWidth: 1.4,
  },
}

const terminalHoverPaintStyles = {
  positive: {
    fill: '#075bd8',
    outlineStroke: '#ffffff',
    outlineWidth: 2.4,
    stroke: '#04194e',
    strokeWidth: 1.6,
  },
  negative: {
    fill: '#d42020',
    outlineStroke: '#ffffff',
    outlineWidth: 2.4,
    stroke: '#560b0a',
    strokeWidth: 1.6,
  },
}

const getTerminalNumber = (terminalId) => terminalId.replace('-endpoint', '')

const getConnectionKey = (firstTerminal, secondTerminal) => (
  [firstTerminal, secondTerminal].sort().join('|')
)

export const isRequiredConnection = (firstTerminal, secondTerminal) => (
  REQUIRED_CONNECTIONS.some(([requiredFirst, requiredSecond]) => (
    getConnectionKey(requiredFirst, requiredSecond) === getConnectionKey(firstTerminal, secondTerminal)
  ))
)

export const isWrongConnection = (instance, connection) => {
  const sourceId = connection?.sourceId || connection?.source?.id
  const targetId = connection?.targetId || connection?.target?.id

  if (!sourceId || !targetId) {
    return false
  }

  const connectionKey = getConnectionKey(sourceId, targetId)

  if (!isRequiredConnection(sourceId, targetId)) {
    return true
  }

  return getAllConnections(instance).filter((currentConnection) => {
    const currentSourceId = currentConnection.sourceId || currentConnection.source?.id
    const currentTargetId = currentConnection.targetId || currentConnection.target?.id

    if (!currentSourceId || !currentTargetId) {
      return false
    }

    return getConnectionKey(currentSourceId, currentTargetId) === connectionKey
  }).length > 1
}

const getConnectionCurvinessKey = (firstTerminal, secondTerminal) => (
  [getTerminalNumber(firstTerminal), getTerminalNumber(secondTerminal)]
    .sort((first, second) => Number(first) - Number(second))
    .join('-')
)

const getTerminalPairLabel = (firstTerminal, secondTerminal) => (
  `${getTerminalNumber(firstTerminal)}-${getTerminalNumber(secondTerminal)}`
)

export const getWireCurviness = (firstTerminal, secondTerminal) => {
  const curviness = WIRE_CURVINESS_BY_CONNECTION[
    getConnectionCurvinessKey(firstTerminal, secondTerminal)
  ]

  return Number.isFinite(curviness) ? curviness : DEFAULT_WIRE_CURVINESS
}

export const getWireConnectorSpec = (firstTerminal, secondTerminal) => [
  WIRE_CONNECTOR_TYPE,
  {
    ...DEFAULT_WIRE_CONNECTOR_OPTIONS,
    curviness: getWireCurviness(firstTerminal, secondTerminal),
  },
]

export const applyWireCurviness = (connection) => {
  const sourceId = connection?.sourceId || connection?.source?.id
  const targetId = connection?.targetId || connection?.target?.id

  if (!sourceId || !targetId || typeof connection?.setConnector !== 'function') {
    return
  }

  const curviness = getWireCurviness(sourceId, targetId)
  const wireRouteKey = [
    WIRE_CONNECTOR_TYPE,
    curviness,
    WIRE_MARGIN,
    WIRE_PROXIMITY_LIMIT,
  ].join(':')

  if (connection.getParameter?.('wireRouteKey') === wireRouteKey) {
    return
  }

  connection.setConnector(getWireConnectorSpec(sourceId, targetId), true)
  connection.setParameter?.('wireRouteKey', wireRouteKey)
}

export const applyAllWireCurviness = (instance) => {
  getAllConnections(instance).forEach(applyWireCurviness)
}

const getCssValue = (styles, propertyName, fallback) => {
  const value = styles.getPropertyValue(propertyName).trim()

  return value || fallback
}

const getCssNumber = (styles, propertyName, fallback) => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName))

  return Number.isFinite(value) ? value : fallback
}

const getEndpointPaintStyle = (element, type, state = 'default') => {
  const styles = window.getComputedStyle(element)
  const prefix = state === 'hover' ? '--jtk-endpoint-hover' : '--jtk-endpoint'
  const defaults = state === 'hover'
    ? terminalHoverPaintStyles[type]
    : terminalPaintStyles[type]

  return {
    fill: getCssValue(styles, `${prefix}-fill`, defaults.fill),
    outlineStroke: getCssValue(
      styles,
      `${prefix}-outline-stroke`,
      defaults.outlineStroke,
    ),
    outlineWidth: getCssNumber(
      styles,
      `${prefix}-outline-width`,
      defaults.outlineWidth,
    ),
    stroke: getCssValue(styles, `${prefix}-stroke`, defaults.stroke),
    strokeWidth: getCssNumber(
      styles,
      `${prefix}-stroke-width`,
      defaults.strokeWidth,
    ),
  }
}

const getEndpointRadius = (element) => (
  getCssNumber(window.getComputedStyle(element), '--jtk-endpoint-radius', 5)
)

const getEndpointCssClass = (terminalId, type) => {
  const terminalNumber = getTerminalNumber(terminalId)

  return [
    'jtk-endpoint--terminal',
    `jtk-endpoint--terminal-${terminalNumber}`,
    'wire-endpoint',
    `wire-endpoint-${terminalNumber}`,
    `jtk-endpoint--${terminalId}`,
    `jtk-endpoint--${type}`,
  ].join(' ')
}

export const wirePaintStyles = {
  positive: {
    outlineStroke: '#07306e',
    outlineWidth: 1.15,
    stroke: '#1f73e6',
    strokeWidth: 4.6,
  },
  negative: {
    outlineStroke: '#771914',
    outlineWidth: 1.15,
    stroke: '#dd342d',
    strokeWidth: 4.6,
  },
}

export const wireHoverPaintStyles = {
  positive: {
    outlineStroke: '#052357',
    outlineWidth: 1.35,
    stroke: '#3a8aff',
    strokeWidth: 5,
  },
  negative: {
    outlineStroke: '#5d110d',
    outlineWidth: 1.35,
    stroke: '#f04a42',
    strokeWidth: 5,
  },
}

export const getConnectionBetween = (instance, firstId, secondId) => {
  const connections = getAllConnections(instance)

  return connections.find((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    return (
      (sourceId === firstId && targetId === secondId)
      || (sourceId === secondId && targetId === firstId)
    )
  })
}

export const hasConnectionBetween = (instance, firstId, secondId) => (
  Boolean(getConnectionBetween(instance, firstId, secondId))
)

export const getAmmeterCurrentKeys = (instance) => {
  const currentKeys = {
    ...DEFAULT_AMMETER_CURRENT_KEYS,
  }

  Object.entries(AMMETER_BRANCH_CONNECTIONS).forEach(([meterLabel, branches]) => {
    const matchedBranch = branches.find((branch) => (
      hasConnectionBetween(
        instance,
        branch.positiveTerminal,
        branch.circuitPositiveTerminal,
      )
      && hasConnectionBetween(
        instance,
        branch.negativeTerminal,
        branch.circuitNegativeTerminal,
      )
    ))

    if (matchedBranch) {
      currentKeys[meterLabel] = matchedBranch.currentKey
    }
  })

  return currentKeys
}

export const addTerminalEndpoint = (instance, terminalId, type) => {
  const element = document.getElementById(terminalId)
  const visualElement = getVisualTerminalElement(terminalId) ?? element

  if (!element) {
    return
  }

  instance.addEndpoint(element, {
    uuid: terminalId,
    endpoint: ['Dot', { radius: getEndpointRadius(element) }],
    cssClass: getEndpointCssClass(terminalId, type),
    anchor: WIRE_ANCHOR,
    isSource: true,
    isTarget: true,
    connectionType: type,
    connectionsDetachable: true,
    connectorStyle: wirePaintStyles[type],
    connectorHoverStyle: wireHoverPaintStyles[type],
    maxConnections: -1,
    paintStyle: getEndpointPaintStyle(visualElement, type),
    hoverPaintStyle: getEndpointPaintStyle(visualElement, type, 'hover'),
  })
}

export const addAllEndpoints = (instance) => {
  POSITIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'positive')
  })

  NEGATIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'negative')
  })

  CIRCUIT_POSITIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'positive')
  })

  CIRCUIT_NEGATIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'negative')
  })
}

export const autoConnectDefaultCircuit = (instance) => {
  if (typeof instance.deleteEveryConnection === 'function') {
    instance.deleteEveryConnection()
  } else {
    getAllConnections(instance).forEach((connection) => {
      instance.deleteConnection?.(connection)
    })
  }

  DEFAULT_AUTO_CONNECTIONS.forEach(([source, target]) => {
    if (hasConnectionBetween(instance, source, target)) {
      return
    }

    instance.connect({
      connector: getWireConnectorSpec(source, target),
      uuids: [source, target],
      type: isNegativeTerminal(source) ? 'negative' : 'positive',
    })
  })

  applyAllWireCurviness(instance)
}

export const validateOldExperimentConnections = (instance) => {
  const requiredConnectionKeys = new Set(
    REQUIRED_CONNECTIONS.map(([firstTerminal, secondTerminal]) => (
      getConnectionKey(firstTerminal, secondTerminal)
    )),
  )
  const matchedConnectionKeys = new Set()
  const wrongConnections = []
  const connections = getAllConnections(instance)

  connections.forEach((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    if (!sourceId || !targetId) {
      return
    }

    const connectionKey = getConnectionKey(sourceId, targetId)
    const connectionDetail = {
      firstTerminal: sourceId,
      label: getTerminalPairLabel(sourceId, targetId),
      secondTerminal: targetId,
    }

    if (!requiredConnectionKeys.has(connectionKey)) {
      wrongConnections.push(connectionDetail)
      return
    }

    if (matchedConnectionKeys.has(connectionKey)) {
      wrongConnections.push({
        ...connectionDetail,
        duplicate: true,
      })
      return
    }

    matchedConnectionKeys.add(connectionKey)
  })

  const missingConnections = REQUIRED_CONNECTIONS
    .filter(([firstTerminal, secondTerminal]) => (
      !matchedConnectionKeys.has(getConnectionKey(firstTerminal, secondTerminal))
    ))
    .map(([firstTerminal, secondTerminal]) => ({
      firstTerminal,
      label: getTerminalPairLabel(firstTerminal, secondTerminal),
      secondTerminal,
    }))

  const totalConnections = connections.length

  return {
    isCorrect: matchedConnectionKeys.size === REQUIRED_CONNECTIONS.length
      && totalConnections === REQUIRED_CONNECTIONS.length,
    matchedCount: matchedConnectionKeys.size,
    missingConnections,
    totalConnections,
    wrongConnections,
  }
}

export const lockJsPlumbCircuit = (instance, containerElement) => {
  getAllConnections(instance).forEach((connection) => {
    connection.setDetachable?.(false)

    connection.endpoints?.forEach((endpoint) => {
      endpoint.setEnabled?.(false)
    })
  })

  containerElement?.classList.add('connection-lab--locked')
}
