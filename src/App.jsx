import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './ConnectionEndpoints.css'
import ConnectionLab from './components/ConnectionLab.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import GraphPanel from './components/GraphPanel.jsx'
import HeaderBoard from './components/HeaderBoard.jsx'
import InstructionsTab from './components/InstructionsTab.jsx'
import { EXPERIMENT_ALERTS } from './alerts/experimentStepAlerts.js'
import { useLabAlerts } from './alerts/useLabAlerts.js'
// import StatusBar from './components/StatusBar.jsx'
 
import { calculateReadings } from './utils/circuitMath.js'
 
const BASE_WIDTH = 1440
const BASE_HEIGHT = 960
const GRAPH_SECTION_GAP = 28
const GRAPH_SECTION_HEIGHT = 430
const CONTENT_HEIGHT = BASE_HEIGHT + GRAPH_SECTION_GAP + GRAPH_SECTION_HEIGHT
const PANEL_MAX_SCALE = 0.9
const PANEL_VIEWPORT_MARGIN = 24
const MIN_GRAPH_READINGS = 6
const MAX_OBSERVATIONS = 10
const VOLTAGE_SAFETY_LIMIT = 8.5
const VOLTAGE_SAFETY_RESET = 7.5

const getScale = () => {
  if (typeof window === 'undefined') {
    return 1
  }

  const widthScale = (window.innerWidth - PANEL_VIEWPORT_MARGIN) / BASE_WIDTH
  const heightScale = (window.innerHeight - PANEL_VIEWPORT_MARGIN) / BASE_HEIGHT

  return Math.max(Math.min(widthScale, heightScale, PANEL_MAX_SCALE), 0.1)
}

const App = () => {
  const { confirmAlert, showStepAlert } = useLabAlerts()
  const [scale, setScale] = useState(getScale)
  const [r1, setR1] = useState(0)
  const [r2, setR2] = useState(0)
  const [r3, setR3] = useState(0)
  const [voltage, setVoltage] = useState(0)
  const [powerOn, setPowerOn] = useState(false)
  const [observations, setObservations] = useState([])
  const [showGraph, setShowGraph] = useState(false)
  const [status, setStatus] = useState('Make the connections, click CHECK, then set the resistance values.')

  const [autoConnectRequest, setAutoConnectRequest] = useState(0)
  const [checkRequest, setCheckRequest] = useState(0)
  const [resetRequest, setResetRequest] = useState(0)
  const [connectionsVerified, setConnectionsVerified] = useState(false)
  const voltageLimitWarningShownRef = useRef(false)

  useEffect(() => {
    const handleResize = () => setScale(getScale())

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const readings = useMemo(
    () => calculateReadings({ voltage: powerOn ? voltage : 0, r1, r2, r3 }),
    [powerOn, r1, r2, r3, voltage],
  )

  const normalizedVoltage = Number(voltage.toFixed(1))
  const hasRecordedVoltage = observations.some((row) => row.voltage === normalizedVoltage)
  const canPlotGraph = observations.length >= MIN_GRAPH_READINGS

  const recordObservation = () => {
    if (!connectionsVerified) {
      setStatus('Check the circuit connections before adding readings.')
      showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
        description: 'Verify the wiring before storing current readings.',
        stepNumber: 6,
        target: '#check-button',
        type: 'warning',
      })
      return
    }

    if (!powerOn) {
      setStatus('Switch on the power supply before adding readings.')
      showStepAlert(EXPERIMENT_ALERTS.cannotStartPower, {
        description: 'Switch on the verified power supply before adding readings.',
        stepNumber: 6,
        target: '#power-toggle-button',
      })
      return
    }

    if (normalizedVoltage <= 0) {
      setStatus('Set the power supply voltage before adding a reading.')
      showStepAlert(EXPERIMENT_ALERTS.adjustVoltage, {
        dedupeKey: 'step-6-zero-voltage',
        description: 'Increase the voltage above 0 V before adding a reading.',
        target: '#voltage-control',
        type: 'warning',
      })
      return
    }

    if (observations.length >= MAX_OBSERVATIONS) {
      setStatus('Ten readings are already recorded. Plot the graph or reset for a new run.')
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: 'The observation table already contains the maximum 10 readings.',
        title: 'Observation Table Is Full',
      })
      return
    }

    if (hasRecordedVoltage) {
      setStatus('Change the power supply voltage before adding another reading.')
      showStepAlert(EXPERIMENT_ALERTS.readingAlreadyExists)
      return
    }

    const nextObservation = {
      id: (observations.at(-1)?.id ?? 0) + 1,
      voltage: normalizedVoltage,
      r1,
      r2,
      r3,
      totalResistance: readings.totalResistance,
      i1: readings.i1,
      i2: readings.i2,
      i3: readings.i3,
    }
    const nextObservationCount = observations.length + 1

    setObservations([...observations, nextObservation])
    setStatus('Reading added to the observation table.')

    if (nextObservationCount === MIN_GRAPH_READINGS) {
      showStepAlert(EXPERIMENT_ALERTS.sufficientData)
    }
  }

  const resetSimulation = useCallback(() => {
    setPowerOn(false)
    setVoltage(0)
    setR1(0)
    setR2(0)
    setR3(0)
    setObservations([])
    setShowGraph(false)
    setAutoConnectRequest(0)
    setCheckRequest(0)
    setConnectionsVerified(false)
    setResetRequest((current) => current + 1)
    voltageLimitWarningShownRef.current = false
    setStatus('Simulation reset. Make the circuit connections again.')
    showStepAlert(EXPERIMENT_ALERTS.resetSuccess)
  }, [showStepAlert])

  const handleReset = async () => {
    const confirmed = await confirmAlert(EXPERIMENT_ALERTS.resetWarning)

    if (confirmed) {
      resetSimulation()
    }
  }

  const handlePlot = () => {
    if (!canPlotGraph) {
      const remainingReadings = MIN_GRAPH_READINGS - observations.length

      setShowGraph(false)
      setStatus(`Add ${remainingReadings} more reading(s) before plotting the graph.`)
      showStepAlert(EXPERIMENT_ALERTS.insufficientGraphReadings, {
        description: `Add ${remainingReadings} more reading(s) before plotting.`,
      })
      return
    }

    setShowGraph(true)
    setStatus('Observation graph plotted from the table readings.')
    showStepAlert(EXPERIMENT_ALERTS.graphPlotted)
  }

  const handlePrint = () => {
    if (!canPlotGraph) {
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: 'Collect at least 6 readings before preparing the print layout.',
      })
      return
    }

    window.print()
  }

  const scaledWidth = Math.ceil(BASE_WIDTH * scale)
  const scaledHeight = Math.ceil(CONTENT_HEIGHT * scale)
  const handleCheckConnections = useCallback((result) => {
    if (result.isCorrect) {
      setConnectionsVerified(true)

      setStatus(
        'Right connections! Please choose resistance values and switch on the power supply.',
      )
      showStepAlert(EXPERIMENT_ALERTS.connectionsVerified)

      return
    }

    setConnectionsVerified(false)

    if (result.totalConnections === 0) {
      setStatus('Please make the connections first.')
      showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
        description: 'No circuit wires were found. Drag node connections before checking.',
        type: 'warning',
      })
      return
    }

    setStatus(
      `Invalid connections. Correct matched points: ${result.matchedCount}; total wires: ${result.totalConnections}.`,
    )
    showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
      description: `Matched ${result.matchedCount} of 8 required wire pairs from ${result.totalConnections} total wires.`,
    })
  }, [showStepAlert])

  const handleCheck = () => {
    setCheckRequest((current) => current + 1)
  }
  const handleTogglePower = () => {
    if (!powerOn && !connectionsVerified) {
      setStatus('Check the circuit connections before switching on the power supply.')
      showStepAlert(EXPERIMENT_ALERTS.cannotStartPower)
      return
    }

    if (powerOn) {
      setPowerOn(false)
      setVoltage(0)
      voltageLimitWarningShownRef.current = false
      setStatus('Power supply switched off.')
      return
    }

    setPowerOn(true)
    setStatus('Power supply switched on. Adjust voltage and add the reading.')
    showStepAlert(EXPERIMENT_ALERTS.powerOn)
  }
  const handleAutoConnect = () => {
    setAutoConnectRequest((current) => current + 1)
    setConnectionsVerified(false)

    setStatus(
      'Default connections added using jsPlumb. Click CHECK to validate and lock the circuit.',
    )
    showStepAlert(EXPERIMENT_ALERTS.circuitConnectionsCompleted)
  }

  const handleVoltageChange = useCallback((nextVoltage) => {
    setVoltage(nextVoltage)

    if (!powerOn || nextVoltage <= 0) {
      if (nextVoltage < VOLTAGE_SAFETY_RESET) {
        voltageLimitWarningShownRef.current = false
      }

      return
    }

    if (nextVoltage >= VOLTAGE_SAFETY_LIMIT && !voltageLimitWarningShownRef.current) {
      voltageLimitWarningShownRef.current = true
      showStepAlert(EXPERIMENT_ALERTS.voltageSafetyLimit, {
        description: `${nextVoltage.toFixed(1)} V is close to the 10 V supply limit.`,
      })
      return
    }

    if (nextVoltage < VOLTAGE_SAFETY_RESET) {
      voltageLimitWarningShownRef.current = false
    }
  }, [powerOn, showStepAlert])

  return (
    <div id="app-wrapper">
      <div
        id="app-viewport"
        style={{
          height: `${scaledHeight}px`,
          width: `${scaledWidth}px`,
        }}
      >
        <div
          id="app-scale"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <main className="simulation-shell" id="walkthrough-demo-experiment">
            <HeaderBoard />
            <InstructionsTab />
            {/* <StatusBar status={status} /> */}
            <span className="sr-only" role="status" aria-live="polite">{status}</span>

            <section className="workspace-grid">
              <aside className="left-panel">
                <ActionButtons
                  disabledButtons={{
                    onAdd: false,
                    onAutoConnect: connectionsVerified || powerOn,
                    onCheck: connectionsVerified,
                    onPlot: false,
                    onPrint: false,
                  }}
                  onAdd={recordObservation}
                  onCheck={handleCheck}
                  onPlot={handlePlot}
                  onPrint={handlePrint}
                  onReset={handleReset}
                  onAutoConnect={handleAutoConnect}
                />

                <ControlPanel
                  locked={!connectionsVerified || powerOn || observations.length > 0}
                  observations={observations}
                  r1={r1}
                  r2={r2}
                  r3={r3}
                  setR1={setR1}
                  setR2={setR2}
                  setR3={setR3}
                />
              </aside>

              <section className="right-panel">
                <ConnectionLab
                  autoConnectRequest={autoConnectRequest}
                  checkRequest={checkRequest}
                  onCheckConnections={handleCheckConnections}
                  powerOn={powerOn}
                  r1={r1}
                  r2={r2}
                  r3={r3}
                  readings={readings}
                  resetRequest={resetRequest}
                  scale={scale}
                  onTogglePower={handleTogglePower}
                  setVoltage={handleVoltageChange}
                  voltage={voltage}
                />
              </section>
            </section>

          </main>

          <GraphPanel
            className="graph-panel--separate"
            id="graph-panel"
            observations={observations}
            plotted={showGraph}
          />
        </div>
      </div>
    </div>
  )
}

export default App
