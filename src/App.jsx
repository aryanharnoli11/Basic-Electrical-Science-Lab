import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './ConnectionEndpoints.css'
import ConnectionLab from './components/ConnectionLab.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import GraphPanel from './components/GraphPanel.jsx'
import HeaderBoard from './components/HeaderBoard.jsx'
import ReportControls from './components/ReportControls.jsx'
import WalkthroughStartButton from './walkthrough/components/WalkthroughStartButton.jsx'
import { EXPERIMENT_ALERTS } from './alerts/experimentStepAlerts.js'
import { useLabAlerts } from './alerts/useLabAlerts.js'
import { useAiGuideNarration } from './aiGuide/useAiGuideNarration.js'
// import StatusBar from './components/StatusBar.jsx'
 
import { calculateReadings } from './utils/circuitMath.js'
import { generateKclReport } from './utils/reportGenerator.js'
import {
  AUTOTRANSFORMER_OUTPUT_VOLTAGE,
  MAX_LAMP_LOAD_LEVEL,
  createTransformerObservation,
} from './utils/lampLoadReadings.js'
 
const BASE_WIDTH = 1435
const BASE_HEIGHT = 960
const GRAPH_SECTION_GAP = 28
const GRAPH_SECTION_HEIGHT = 430
const CONTENT_HEIGHT = BASE_HEIGHT + GRAPH_SECTION_GAP + GRAPH_SECTION_HEIGHT
const PANEL_MAX_SCALE = 0.95
const PANEL_VIEWPORT_MARGIN = 32
const MAX_OBSERVATIONS = MAX_LAMP_LOAD_LEVEL + 1
const MIN_GRAPH_READINGS = MAX_OBSERVATIONS
const VOLTAGE_SAFETY_LIMIT = 240
const VOLTAGE_SAFETY_RESET = 220

const formatConnectionList = (connections) => (
  connections.map((connection) => connection.label).join(', ')
)

const getWrongConnectionDescription = ({ missingConnections = [], wrongConnections = [] }) => {
  const wrongLabel = wrongConnections.length === 1 ? 'Wrong connection' : 'Wrong connections'
  const alertParts = [`${wrongLabel}: ${formatConnectionList(wrongConnections)}.`]

  if (missingConnections.length > 0) {
    alertParts.push(`Missing connections: ${formatConnectionList(missingConnections)}.`)
  }

  return alertParts.join(' ')
}

const getMissingConnectionDescription = ({ missingConnections = [] }) => (
  `Missing connections: ${formatConnectionList(missingConnections)}.`
)

const getScale = () => {
  if (typeof window === 'undefined') {
    return 1
  }

  const widthScale = (window.innerWidth - PANEL_VIEWPORT_MARGIN) / BASE_WIDTH

  return Math.max(Math.min(widthScale, PANEL_MAX_SCALE), 0.1)
}

const App = () => {
  const { clearAlerts, showStepAlert } = useLabAlerts()
  const [scale, setScale] = useState(getScale)
  const [r1, setR1] = useState(0)
  const [r2, setR2] = useState(0)
  const [r3, setR3] = useState(0)
  const [voltage, setVoltage] = useState(0)
  const [powerOn, setPowerOn] = useState(false)
  const [activeLoadLevel, setActiveLoadLevel] = useState(0)
  const [observations, setObservations] = useState([])
  const [graphGenerated, setGraphGenerated] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [status, setStatus] = useState('Apparatus cleared. Add the new images before continuing the experiment flow.')

  const [autoConnectRequest, setAutoConnectRequest] = useState(0)
  const [checkRequest, setCheckRequest] = useState(0)
  const [resetRequest, setResetRequest] = useState(0)
  const [connectionsVerified, setConnectionsVerified] = useState(false)
  const [sessionStart, setSessionStart] = useState(() => Date.now())
  const autotransformerReadyAlertShownRef = useRef(false)
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
  const hasDuplicateReading = observations.some((row) => (
    row.loadLevel === activeLoadLevel
  ))
  const readingCount = observations.length
  const canPlotGraph = readingCount >= MIN_GRAPH_READINGS
  const nextEnabledLoadLevel = (
    powerOn
    && normalizedVoltage >= AUTOTRANSFORMER_OUTPUT_VOLTAGE
    && readingCount === activeLoadLevel + 1
    && activeLoadLevel < MAX_LAMP_LOAD_LEVEL
  )
    ? activeLoadLevel + 1
    : 0

  const handleAiGuideStart = useCallback(() => {
    setStatus('AI Guide narration started.')
  }, [])

  const handleAiGuideFinish = useCallback(() => {
    setStatus('AI Guide narration completed.')
  }, [])

  const handleAiGuideError = useCallback(() => {
    setStatus('AI Guide narration could not start. Add audio files or use a browser with speech synthesis.')
  }, [])

  const {
    isPlaying: aiGuidePlaying,
    start: startAiGuide,
    stop: stopAiGuide,
  } = useAiGuideNarration({
    onError: handleAiGuideError,
    onFinish: handleAiGuideFinish,
    onStart: handleAiGuideStart,
  })

  const handleAiGuide = useCallback(() => {
    if (aiGuidePlaying) {
      stopAiGuide()
      setStatus('AI Guide narration stopped.')
      return
    }

    startAiGuide()
  }, [aiGuidePlaying, startAiGuide, stopAiGuide])

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

    if (normalizedVoltage < AUTOTRANSFORMER_OUTPUT_VOLTAGE) {
      setStatus('Please rotate the autotransformer knob first.')
      showStepAlert(EXPERIMENT_ALERTS.rotateAutotransformerBeforeAdd)
      return
    }

    if (readingCount >= MAX_OBSERVATIONS) {
      setStatus('All load readings are already recorded. Plot the graph or reset for a new run.')
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: `The observation table already contains the maximum ${MAX_OBSERVATIONS} readings.`,
        title: 'Observation Table Is Full',
      })
      return
    }

    if (hasDuplicateReading) {
      setStatus('Duplicate reading cannot be added to the observation table.')
      showStepAlert(EXPERIMENT_ALERTS.readingAlreadyExists, {
        description: 'This lamp-load reading already exists in the observation table. Turn ON the next enabled switch before adding another reading.',
        title: 'Duplicate Reading Not Allowed',
      })
      return
    }

    const nextObservationId = (observations.at(-1)?.id ?? 0) + 1
    const nextObservation = {
      ...createTransformerObservation({
        id: nextObservationId,
        loadLevel: activeLoadLevel,
      }),
      r1,
      r2,
      r3,
      totalResistance: readings.totalResistance,
    }
    const nextObservationCount = readingCount + 1

    setObservations([...observations, nextObservation])
    setGraphGenerated(false)
    setReportGenerated(false)
    setStatus('Reading added to the observation table.')

    if (nextObservationCount === MIN_GRAPH_READINGS) {
      showStepAlert(EXPERIMENT_ALERTS.sufficientData)
    }
  }

  const resetSimulation = useCallback(() => {
    stopAiGuide()
    setPowerOn(false)
    setVoltage(0)
    setActiveLoadLevel(0)
    setR1(0)
    setR2(0)
    setR3(0)
    setObservations([])
    setGraphGenerated(false)
    setReportGenerated(false)
    setAutoConnectRequest(0)
    setCheckRequest(0)
    setConnectionsVerified(false)
    setResetRequest((current) => current + 1)
    setSessionStart(Date.now())
    autotransformerReadyAlertShownRef.current = false
    voltageLimitWarningShownRef.current = false
    setStatus('The simulation has been reset. You can start again.')
    showStepAlert(EXPERIMENT_ALERTS.simulationReset)
  }, [showStepAlert, stopAiGuide])

  const handleReset = () => {
    clearAlerts()
    resetSimulation()
  }

  const handlePlot = () => {
    if (!canPlotGraph) {
      const remainingReadings = MIN_GRAPH_READINGS - readingCount

      setGraphGenerated(false)
      setReportGenerated(false)
      setStatus(`Add ${remainingReadings} more reading(s) before plotting the graph.`)
      showStepAlert(EXPERIMENT_ALERTS.insufficientGraphReadings, {
        description: `Add ${remainingReadings} more reading(s) before plotting.`,
      })
      return
    }

    setGraphGenerated(true)
    setReportGenerated(false)
    setStatus('Observation graph plotted from the table readings.')
    showStepAlert(EXPERIMENT_ALERTS.graphPlotted)
  }

  const handlePrint = () => {
    if (!canPlotGraph) {
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: `Collect at least ${MIN_GRAPH_READINGS} readings before preparing the print layout.`,
      })
      return
    }

    if (!graphGenerated) {
      setStatus('Please generate the graph first.')
      showStepAlert(EXPERIMENT_ALERTS.insufficientGraphReadings, {
        description: 'Please generate the graph first.',
        target: '#plot-button',
        title: 'Generate Graph First',
        type: 'warning',
      })
      window.alert('Please generate the graph first.')
      return
    }

    window.print()
  }

  const handleGenerateReport = () => {
    if (readingCount < MIN_GRAPH_READINGS) {
      const remainingReadings = MIN_GRAPH_READINGS - readingCount

      setStatus(`Add ${remainingReadings} more reading(s) before generating the report.`)
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: `Add ${remainingReadings} more reading(s), then plot the graph before generating a report.`,
        target: '#generate-report-button',
        title: `Report Requires ${MIN_GRAPH_READINGS} Readings`,
      })
      return
    }

    if (!graphGenerated) {
      setStatus('Please generate the graph first.')
      showStepAlert(EXPERIMENT_ALERTS.insufficientGraphReadings, {
        description: 'Please generate the graph first.',
        target: '#plot-button',
        title: 'Generate Graph First',
        type: 'warning',
      })
      window.alert('Please generate the graph first.')
      return
    }

    const generated = generateKclReport({
      observations,
      resistances: { r1, r2, r3 },
      sessionStart,
    })

    if (!generated) {
      setStatus('Unable to open the report window.')
      window.alert('Unable to open the report window. Please allow pop-ups and try again.')
      return
    }

    setReportGenerated(true)
    setStatus('Experiment report generated from the plotted graph and current observations.')
    showStepAlert(EXPERIMENT_ALERTS.printLayoutGenerated, {
      description: 'The KCL report was generated from the plotted graph and current observations.',
      target: '#generate-report-button',
      title: 'Report Generated Successfully',
    })
  }

  const scaledWidth = Math.ceil(BASE_WIDTH * scale)
  const scaledHeight = Math.ceil(CONTENT_HEIGHT * scale)
  const handleCheckConnections = useCallback((result) => {
    if (result.isCorrect) {
      setConnectionsVerified(true)

      setStatus('Connections are correct, click on the MCB to turn it ON.')
      showStepAlert(EXPERIMENT_ALERTS.connectionsVerified, {
        description: null,
        target: '#power-toggle-button',
        title: 'Connections are correct, click on the MCB to turn it ON',
      })

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

    if (result.wrongConnections?.length > 0) {
      const description = getWrongConnectionDescription(result)
      const title = result.wrongConnections.length === 1
        ? 'Wrong connection'
        : 'Wrong connections'

      setStatus(description)
      showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
        description,
        target: '#connection-lab',
        title,
      })
      return
    }

    if (result.missingConnections?.length > 0) {
      const description = getMissingConnectionDescription(result)

      setStatus(description)
      showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
        description,
        target: '#connection-lab',
        title: 'Missing connections',
        type: 'warning',
      })
      return
    }

    setStatus(
      `Invalid connections. Correct matched points: ${result.matchedCount}; total wires: ${result.totalConnections}.`,
    )
    showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
      description: `Matched ${result.matchedCount} of 15 required wire pairs from ${result.totalConnections} total wires.`,
    })
  }, [showStepAlert])

  const handleCheck = () => {
    setCheckRequest((current) => current + 1)
  }
  const handleTogglePower = () => {
    if (!powerOn && !connectionsVerified) {
      setStatus('Make and check the connections before turning on the MCB.')
      showStepAlert(EXPERIMENT_ALERTS.makeConnectionsBeforeMcb)
      return
    }

    if (powerOn) {
      setPowerOn(false)
      setVoltage(0)
      setActiveLoadLevel(0)
      autotransformerReadyAlertShownRef.current = false
      voltageLimitWarningShownRef.current = false
      setStatus('You turned off the MCB. Turn it back ON to continue the simulation.')
      showStepAlert(EXPERIMENT_ALERTS.mcbTurnedOffDuringExperiment)
      return
    }

    setPowerOn(true)
    setStatus('MCB has been turned ON. Now click on the autotransformer knob.')
    showStepAlert(EXPERIMENT_ALERTS.powerOn, {
      description: null,
      target: '#voltage-control',
      title: 'MCB has been turned ON. Now click on the autotransformer knob',
    })
  }
  const handleAutoConnect = () => {
    setAutoConnectRequest((current) => current + 1)
    setConnectionsVerified(false)

    setStatus('Autoconnect Completed. Click on the check button to verify the connections.')
    showStepAlert(EXPERIMENT_ALERTS.circuitConnectionsCompleted, {
      description: 'Click on the check button to verify the connections.',
      target: '#check-button',
      title: 'Autoconnect Completed',
    })
  }

  const handleVoltageControlBlocked = useCallback(() => {
    setStatus('Please complete the connections first and turn ON the MCB.')
    showStepAlert(EXPERIMENT_ALERTS.completeConnectionsBeforeAutotransformer)
  }, [showStepAlert])

  const handleConnectionRemovalBlocked = useCallback(() => {
    setStatus('Turn off MCB before removing the connection.')
    showStepAlert(EXPERIMENT_ALERTS.turnOffMcbBeforeRemovingConnection)
  }, [showStepAlert])

  const handleLoadLevelChange = useCallback((nextLoadLevel) => {
    if (nextLoadLevel !== nextEnabledLoadLevel) {
      return
    }

    setActiveLoadLevel(nextLoadLevel)
    setGraphGenerated(false)
    setReportGenerated(false)
    setStatus(`Lamp load switch ${nextLoadLevel} turned ON. Click ADD to record the reading.`)
  }, [nextEnabledLoadLevel])

  const handleVoltageChange = useCallback((nextVoltage) => {
    setVoltage(nextVoltage)

    if (!powerOn || nextVoltage <= 0) {
      if (nextVoltage < VOLTAGE_SAFETY_RESET) {
        autotransformerReadyAlertShownRef.current = false
        voltageLimitWarningShownRef.current = false
      }

      return
    }

    if (
      nextVoltage >= AUTOTRANSFORMER_OUTPUT_VOLTAGE
      && voltage < AUTOTRANSFORMER_OUTPUT_VOLTAGE
      && !autotransformerReadyAlertShownRef.current
    ) {
      autotransformerReadyAlertShownRef.current = true
      setStatus('The readings are now displayed on the meters. Now, click on the add button to add the readings to the observation table.')
      showStepAlert(EXPERIMENT_ALERTS.autotransformerReadingsReady)
    }

    if (nextVoltage >= VOLTAGE_SAFETY_LIMIT && !voltageLimitWarningShownRef.current) {
      voltageLimitWarningShownRef.current = true
      showStepAlert(EXPERIMENT_ALERTS.voltageSafetyLimit, {
        description: `${nextVoltage.toFixed(1)} V is close to the 10 V supply limit.`,
      })
      return
    }

    if (nextVoltage < VOLTAGE_SAFETY_RESET) {
      autotransformerReadyAlertShownRef.current = false
      voltageLimitWarningShownRef.current = false
    }
  }, [powerOn, showStepAlert, voltage])

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
            height: `${CONTENT_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        >
          <main className="simulation-shell" id="walkthrough-demo-experiment">
            <HeaderBoard />
            <WalkthroughStartButton variant="side-tab" />
            {/* <StatusBar status={status} /> */}
            <span className="sr-only" role="status" aria-live="polite">{status}</span>

            <section className="workspace-grid">
              <aside className="left-panel">
                <ActionButtons
                  activeButtons={{
                    onAiGuide: aiGuidePlaying,
                  }}
                  disabledButtons={{
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
                  onAiGuide={handleAiGuide}
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
                  key={`connection-lab-${resetRequest}`}
                  activeLoadLevel={activeLoadLevel}
                  autoConnectRequest={autoConnectRequest}
                  checkRequest={checkRequest}
                  nextEnabledLoadLevel={nextEnabledLoadLevel}
                  onCheckConnections={handleCheckConnections}
                  onConnectionRemovalBlocked={handleConnectionRemovalBlocked}
                  onLoadLevelChange={handleLoadLevelChange}
                  powerOn={powerOn}
                  r1={r1}
                  r2={r2}
                  r3={r3}
                  readings={readings}
                  resetRequest={resetRequest}
                  scale={scale}
                  onTogglePower={handleTogglePower}
                  onVoltageControlBlocked={handleVoltageControlBlocked}
                  setVoltage={handleVoltageChange}
                  voltage={voltage}
                />
              </section>
            </section>

            <ReportControls
              graphGenerated={graphGenerated}
              minReadings={MIN_GRAPH_READINGS}
              onGenerateReport={handleGenerateReport}
              readingCount={readingCount}
              reportGenerated={reportGenerated}
            />

          </main>

          <GraphPanel
            className="graph-panel--separate"
            id="graph-panel"
            observations={observations}
            plotted={graphGenerated}
          />
        </div>
      </div>
    </div>
  )
}

export default App
