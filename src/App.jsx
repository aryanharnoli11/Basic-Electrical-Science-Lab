import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './ConnectionEndpoints.css'
import ConnectionLab from './components/ConnectionLab.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import FormulaSection from './components/FormulaSection.jsx'
import HeaderBoard from './components/HeaderBoard.jsx'
import ReportControls from './components/ReportControls.jsx'
import ResultsGraphs from './components/ResultsGraphs.jsx'
import WalkthroughStartButton from './walkthrough/components/WalkthroughStartButton.jsx'
import { EXPERIMENT_ALERTS } from './alerts/experimentStepAlerts.js'
import { useLabAlerts } from './alerts/useLabAlerts.js'
import { useSimulationAudioGuide } from './aiGuide/useSimulationAudioGuide.js'
import { SIMULATION_AUDIO } from './audio/simulationAudio.js'
import { useQueuedAudioPlayer } from './audio/useQueuedAudioPlayer.js'
// import StatusBar from './components/StatusBar.jsx'
 
import { calculateReadings } from './utils/circuitMath.js'
import { generateTransformerReport } from './utils/reportGenerator.js'
import {
  AUTOTRANSFORMER_OUTPUT_VOLTAGE,
  MAX_LAMP_LOAD_LEVEL,
  createTransformerObservation,
} from './utils/lampLoadReadings.js'
 
const BASE_WIDTH = 1440
const BASE_HEIGHT = 960
const GRAPH_SECTION_GAP = 28
const RESULTS_GRAPH_SECTION_HEIGHT = 430
const FOOTER_HEIGHT = 32
const CONTENT_HEIGHT = BASE_HEIGHT
  + GRAPH_SECTION_GAP
  + RESULTS_GRAPH_SECTION_HEIGHT
  + FOOTER_HEIGHT
const PANEL_MAX_SCALE = 1
const PANEL_VIEWPORT_MARGIN = 32
const MIN_RENDER_SCALE = 2
const MAX_RENDER_SCALE = 3
const MAX_OBSERVATIONS = MAX_LAMP_LOAD_LEVEL + 1
const MIN_GRAPH_READINGS = MAX_OBSERVATIONS
const VOLTAGE_SAFETY_LIMIT = 240
const VOLTAGE_SAFETY_RESET = 220
const READING_ADDED_ALERTS = [
  null,
  EXPERIMENT_ALERTS.firstReadingAdded,
  EXPERIMENT_ALERTS.secondReadingAdded,
  EXPERIMENT_ALERTS.thirdReadingAdded,
  EXPERIMENT_ALERTS.fourthReadingAdded,
  EXPERIMENT_ALERTS.fifthReadingAdded,
]
const READING_ADDED_AUDIO = [
  null,
  SIMULATION_AUDIO.firstReadingAdded,
  SIMULATION_AUDIO.secondReadingAdded,
  SIMULATION_AUDIO.thirdReadingAdded,
  SIMULATION_AUDIO.fourthReadingAdded,
  SIMULATION_AUDIO.fifthReadingAdded,
]
const LOAD_SWITCH_ALERTS = [
  null,
  EXPERIMENT_ALERTS.firstSwitchOn,
  EXPERIMENT_ALERTS.secondSwitchOn,
  EXPERIMENT_ALERTS.thirdSwitchOn,
  EXPERIMENT_ALERTS.fourthSwitchOn,
]
const LOAD_SWITCH_AUDIO = [
  null,
  SIMULATION_AUDIO.firstSwitchOn,
  SIMULATION_AUDIO.secondSwitchOn,
  SIMULATION_AUDIO.thirdSwitchOn,
  SIMULATION_AUDIO.fourthSwitchOn,
]

const formatConnectionList = (connections) => (
  connections.map((connection) => connection.label).join(', ')
)

const getWrongConnectionDescription = ({ missingConnections = [], wrongConnections = [] }) => {
  const wrongLabel = wrongConnections.length === 1 ? 'Wrong connection' : 'Wrong connections'
  const alertParts = [`${wrongLabel}: ${formatConnectionList(wrongConnections)}.`]

  if (missingConnections.length > 0) {
    alertParts.push(`Missing connections: ${formatConnectionList(missingConnections)}.`)
  }

  return alertParts.join('\n\n')
}

const getMissingConnectionDescription = ({ missingConnections = [] }) => (
  `Missing connections: ${formatConnectionList(missingConnections)}.`
)

const getConnectionResultAudio = ({ missingConnections = [], wrongConnections = [] }) => {
  const totalErrors = wrongConnections.length > 0
    ? wrongConnections.length
    : missingConnections.length

  if (totalErrors <= 1) {
    return SIMULATION_AUDIO.wrongConnection
  }

  return SIMULATION_AUDIO.multipleWrongConnections
}

const getCheckResultAudio = (result, checkedAfterAutoConnect) => {
  if (result.isCorrect) {
    return checkedAfterAutoConnect
      ? SIMULATION_AUDIO.forCorrectConnectionsCheckClick
      : SIMULATION_AUDIO.correctConnections
  }

  if (result.totalConnections === 0) {
    return SIMULATION_AUDIO.multipleWrongConnections
  }

  if (result.wrongConnections?.length > 0 || result.missingConnections?.length > 0) {
    return getConnectionResultAudio(result)
  }

  return SIMULATION_AUDIO.multipleWrongConnections
}

const getScale = () => {
  if (typeof window === 'undefined') {
    return 1
  }

  const widthScale = (window.innerWidth - PANEL_VIEWPORT_MARGIN) / BASE_WIDTH

  return Math.max(Math.min(widthScale, PANEL_MAX_SCALE), 0.1)
}

const getRenderScale = () => {
  if (typeof window === 'undefined') {
    return MIN_RENDER_SCALE
  }

  const dpr = Number.isFinite(window.devicePixelRatio)
    ? window.devicePixelRatio
    : 1

  return Math.min(Math.max(Math.ceil(dpr), MIN_RENDER_SCALE), MAX_RENDER_SCALE)
}

const getViewportMetrics = () => ({
  renderScale: getRenderScale(),
  scale: getScale(),
})

const App = () => {
  const { clearAlerts, showStepAlert } = useLabAlerts()
  const {
    play: playSimulationAudio,
    stop: stopSimulationAudio,
  } = useQueuedAudioPlayer()
  const [viewportMetrics, setViewportMetrics] = useState(getViewportMetrics)
  const { renderScale, scale } = viewportMetrics
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
  const autoConnectAwaitingCheckRef = useRef(false)
  const autotransformerReadyAlertShownRef = useRef(false)
  const autoConnectCircuitRef = useRef(null)
  const validateConnectionsRef = useRef(null)
  const voltageLimitWarningShownRef = useRef(false)

  useEffect(() => {
    const handleResize = () => setViewportMetrics(getViewportMetrics())

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
  const canAddReading = (
    connectionsVerified
    && powerOn
    && normalizedVoltage >= AUTOTRANSFORMER_OUTPUT_VOLTAGE
  )
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
    setStatus('AI Guide connection guidance completed.')
  }, [])

  const handleAiGuideError = useCallback(() => {
    setStatus('AI Guide narration could not start. Add audio files or use a browser with speech synthesis.')
  }, [])

  const handleAiGuideStop = useCallback(() => {
    setStatus('AI Guide narration stopped.')
  }, [])

  const {
    activeConnection: aiGuideActiveConnection,
    highlightedTerminalIds: aiGuideHighlightedTerminalIds,
    isPlaying: aiGuidePlaying,
    onConnectionComplete: handleAiGuideConnectionComplete,
    start: startAiGuide,
    stop: stopAiGuide,
  } = useSimulationAudioGuide({
    onError: handleAiGuideError,
    onFinish: handleAiGuideFinish,
    onStart: handleAiGuideStart,
    onStatus: setStatus,
    onStop: handleAiGuideStop,
  })

  const handleAiGuide = useCallback(() => {
    if (aiGuidePlaying) {
      stopAiGuide()
      return
    }

    stopSimulationAudio()
    startAiGuide()
  }, [aiGuidePlaying, startAiGuide, stopAiGuide, stopSimulationAudio])

  const recordObservation = () => {
    if (!connectionsVerified) {
      setStatus('Check the circuit connections before adding readings.')
      showStepAlert(EXPERIMENT_ALERTS.connectionErrorFound, {
        description: 'Verify the wiring before storing current readings.',
        target: '#check-button',
        type: 'warning',
      })
      return
    }

    if (!powerOn) {
      setStatus('Switch on the power supply before adding readings.')
      showStepAlert(EXPERIMENT_ALERTS.cannotStartPower, {
        description: 'Switch on the verified power supply before adding readings.',
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
      playSimulationAudio(SIMULATION_AUDIO.duplicateReading)
      setStatus('This reading already exists in the observation table. Turn ON the next enabled switch before adding the readings.')
      showStepAlert(EXPERIMENT_ALERTS.readingAlreadyExists)
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
    const readingAddedAlert = READING_ADDED_ALERTS[nextObservationCount] ?? EXPERIMENT_ALERTS.readingAdded
    const readingAddedAudio = READING_ADDED_AUDIO[nextObservationCount]

    playSimulationAudio(readingAddedAudio)

    setObservations([...observations, nextObservation])
    setGraphGenerated(false)
    setReportGenerated(false)
    setStatus(readingAddedAlert.description ?? 'Reading added to the observation table.')
    showStepAlert(readingAddedAlert)
  }

  const resetSimulation = useCallback(() => {
    stopAiGuide()
    stopSimulationAudio()
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
    autoConnectAwaitingCheckRef.current = false
    autotransformerReadyAlertShownRef.current = false
    voltageLimitWarningShownRef.current = false
    setStatus('The simulation has been reset. You can start again.')
    showStepAlert(EXPERIMENT_ALERTS.simulationReset)
  }, [showStepAlert, stopAiGuide, stopSimulationAudio])

  const handleReset = () => {
    clearAlerts()
    resetSimulation()
    playSimulationAudio(SIMULATION_AUDIO.reset)
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
    playSimulationAudio(SIMULATION_AUDIO.graphPlotted)
    setStatus('Observation graph plotted from the table readings.')
    showStepAlert(EXPERIMENT_ALERTS.graphPlotted)
  }

  const handlePrint = async () => {
    await playSimulationAudio(SIMULATION_AUDIO.print)
    window.print()
  }

  const handleGenerateReport = () => {
    if (readingCount < MIN_GRAPH_READINGS) {
      const remainingReadings = MIN_GRAPH_READINGS - readingCount

      setStatus(`Add ${remainingReadings} more reading(s) before generating the report.`)
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: `Add ${remainingReadings} more reading(s) before generating a report.`,
        target: '#generate-report-button',
        title: `Report Requires ${MIN_GRAPH_READINGS} Readings`,
      })
      return
    }

    if (!graphGenerated) {
      setStatus('Plot the graph before generating the report.')
      showStepAlert(EXPERIMENT_ALERTS.minimumReadingsRequired, {
        description: 'Click the Plot button to generate the graphs before generating a report.',
        target: '#plot-button',
        title: 'Plot Graph Before Report',
      })
      return
    }

    playSimulationAudio(SIMULATION_AUDIO.generateReportClick)
    setStatus('Your report has been generated successfully. Click OK to view your report.')
    showStepAlert(EXPERIMENT_ALERTS.reportGenerated, {
      onConfirm: () => {
        const generated = generateTransformerReport({
          observations,
          sessionStart,
        })

        if (!generated) {
          setStatus('Unable to open the report window.')
          window.alert('Unable to open the report window. Please allow pop-ups and try again.')
          return
        }

        setReportGenerated(true)
        setStatus('Your report has been generated successfully.')
      },
    })
  }

  const scaledWidth = Math.ceil(BASE_WIDTH * scale)
  const scaledHeight = Math.ceil(CONTENT_HEIGHT * scale)
  const handleCheckConnections = useCallback((result) => {
    const checkedAfterAutoConnect = autoConnectAwaitingCheckRef.current
    const checkResultAudio = getCheckResultAudio(result, checkedAfterAutoConnect)

    autoConnectAwaitingCheckRef.current = false
    playSimulationAudio(checkResultAudio)

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
  }, [playSimulationAudio, showStepAlert])

  const handleCheck = () => {
    const validateConnections = validateConnectionsRef.current

    if (validateConnections) {
      handleCheckConnections(validateConnections())
      return
    }

    setCheckRequest((current) => current + 1)
  }

  const handleValidateConnectionsReady = useCallback((validateConnections) => {
    validateConnectionsRef.current = validateConnections
  }, [])

  const handleAutoConnectReady = useCallback((autoConnectCircuit) => {
    autoConnectCircuitRef.current = autoConnectCircuit
  }, [])

  const handleWrongConnectionMade = useCallback(() => {
    playSimulationAudio(SIMULATION_AUDIO.wrongConnection)
  }, [playSimulationAudio])

  const handleTogglePower = () => {
    if (!powerOn && !connectionsVerified) {
      playSimulationAudio(SIMULATION_AUDIO.beforeConnectionMcbAlert)
      setStatus('Make and check the connections before turning on the MCB.')
      showStepAlert(EXPERIMENT_ALERTS.makeConnectionsBeforeMcb)
      return
    }

    if (powerOn) {
      return
    }

    setPowerOn(true)
    playSimulationAudio(SIMULATION_AUDIO.mcbOn)
    setStatus('MCB has been turned ON. Now click on the autotransformer knob.')
    showStepAlert(EXPERIMENT_ALERTS.powerOn, {
      description: null,
      target: '#voltage-control',
      title: 'MCB has been turned ON. Now click on the autotransformer knob',
    })
  }
  const handleAutoConnect = () => {
    const wasAiGuidePlaying = aiGuidePlaying

    if (wasAiGuidePlaying) {
      stopAiGuide()
    }

    const autoConnectCircuit = autoConnectCircuitRef.current

    if (autoConnectCircuit) {
      autoConnectCircuit()
    } else {
      setAutoConnectRequest((current) => current + 1)
    }

    setConnectionsVerified(false)
    autoConnectAwaitingCheckRef.current = true

    playSimulationAudio(SIMULATION_AUDIO.autoConnect)

    setStatus('Autoconnect Completed. Click on the check button to verify the connections.')
    showStepAlert(EXPERIMENT_ALERTS.circuitConnectionsCompleted, {
      description: 'Click on the check button to verify the connections.',
      target: '#check-button',
      title: 'Autoconnect Completed',
    })
  }

  const handleVoltageControlBlocked = useCallback(() => {
    playSimulationAudio(SIMULATION_AUDIO.autotransformerBlocked)
    setStatus('Please complete the connections first and turn ON the MCB.')
    showStepAlert(EXPERIMENT_ALERTS.completeConnectionsBeforeAutotransformer)
  }, [playSimulationAudio, showStepAlert])

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
    const loadSwitchAlert = LOAD_SWITCH_ALERTS[nextLoadLevel]
    const loadSwitchAudio = LOAD_SWITCH_AUDIO[nextLoadLevel]
    setStatus(loadSwitchAlert?.description ?? `Lamp load switch ${nextLoadLevel} turned ON. Click ADD to record the reading.`)
    playSimulationAudio(loadSwitchAudio)

    if (loadSwitchAlert) {
      showStepAlert(loadSwitchAlert)
    }
  }, [nextEnabledLoadLevel, playSimulationAudio, showStepAlert])

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
      playSimulationAudio(SIMULATION_AUDIO.afterVoltageSet)
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
  }, [playSimulationAudio, powerOn, showStepAlert, voltage])

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
            '--app-scale': scale,
            '--app-render-scale': renderScale,
            height: `${CONTENT_HEIGHT * renderScale}px`,
            width: `${BASE_WIDTH * renderScale}px`,
          }}
        >
          <div id="app-render">
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
                      onAdd: !canAddReading,
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

                  <FormulaSection />

                  <ReportControls
                    graphGenerated={graphGenerated}
                    minReadings={MIN_GRAPH_READINGS}
                    onGenerateReport={handleGenerateReport}
                    readingCount={readingCount}
                    reportGenerated={reportGenerated}
                  />
                </aside>

                <section className="right-panel">
                  <ConnectionLab
                    key={`connection-lab-${resetRequest}`}
                    activeLoadLevel={activeLoadLevel}
                    activeGuideConnection={aiGuideActiveConnection}
                    autoConnectRequest={autoConnectRequest}
                    checkRequest={checkRequest}
                    highlightedTerminalIds={aiGuideHighlightedTerminalIds}
                    nextEnabledLoadLevel={nextEnabledLoadLevel}
                    onAutoConnectReady={handleAutoConnectReady}
                    onCheckConnections={handleCheckConnections}
                    onConnectionRemovalBlocked={handleConnectionRemovalBlocked}
                    onGuideConnectionComplete={handleAiGuideConnectionComplete}
                    onLoadLevelChange={handleLoadLevelChange}
                    onValidateConnectionsReady={handleValidateConnectionsReady}
                    onWrongConnectionMade={handleWrongConnectionMade}
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

            </main>

            <ResultsGraphs
              minReadings={MIN_GRAPH_READINGS}
              observations={observations}
              plotted={graphGenerated}
            />
            <footer className="simulation-footer">
              &copy; 2026 Virtual Labs IIT Roorkee
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
