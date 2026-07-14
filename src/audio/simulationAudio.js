const SIMULATION_AUDIO_BASE_PATH = '/simulation-audios/'

export const simulationAudioUrl = (fileName) => (
  `${SIMULATION_AUDIO_BASE_PATH}${encodeURIComponent(fileName)}`
)

export const SIMULATION_AUDIO = {
  afterVoltageSet: simulationAudioUrl('After Voltage is set.wav'),
  aiGuideClick: simulationAudioUrl('AI Guide click.wav'),
  allGuideConnectionsComplete: simulationAudioUrl('Guide all complete conn.wav'),
  autoConnect: simulationAudioUrl('Autoconnect.wav'),
  autotransformerBlocked: simulationAudioUrl('Autotransformer click after check disabled.wav'),
  beforeConnectionMcbAlert: simulationAudioUrl('Before connection, on-click MCB Alert.wav'),
  correctConnections: simulationAudioUrl('Correct Connections.wav'),
  duplicateReading: simulationAudioUrl('Duplicate Readings.wav'),
  fifthReadingAdded: simulationAudioUrl('5th readings added.wav'),
  firstCheckClick: simulationAudioUrl('1st time check button click.wav'),
  firstReadingAdded: simulationAudioUrl('1st readings added.wav'),
  firstSwitchOn: simulationAudioUrl('First Switch ON.wav'),
  firstTimeAutotransformerClick: simulationAudioUrl('1st time autotransformer click.wav'),
  forCorrectConnectionsCheckClick: simulationAudioUrl('For correct connections, check click.wav'),
  fourthReadingAdded: simulationAudioUrl('4th readings added.wav'),
  fourthSwitchOn: simulationAudioUrl('Fourth Switch ON.wav'),
  generateReportClick: simulationAudioUrl('Generate Report button click.wav'),
  graphPlotted: simulationAudioUrl('Graphs Plotted Successfully.wav'),
  mcbOn: simulationAudioUrl('MCB ON.wav'),
  multipleWrongConnections: simulationAudioUrl('Multiple wrong connections.wav'),
  nextConnection: simulationAudioUrl("Let's move on to the next connection.wav"),
  print: simulationAudioUrl('Print.wav'),
  reset: simulationAudioUrl('Reset.wav'),
  secondReadingAdded: simulationAudioUrl('2nd readings added.wav'),
  secondSwitchOn: simulationAudioUrl('Second Switch ON.wav'),
  thirdReadingAdded: simulationAudioUrl('3rd readings added.wav'),
  thirdSwitchOn: simulationAudioUrl('Third Switch ON.wav'),
  walkthroughComplete: simulationAudioUrl('The interface walkthrough is now complete.wav'),
  wrongConnection: simulationAudioUrl('Wrong connection.wav'),
}

export const CONNECTION_AUDIO_BY_LABEL = {
  '1-11': SIMULATION_AUDIO.correctConnections,
  '2-12': simulationAudioUrl('Connect terminal  2 to terminal 12.wav'),
  '3-13': simulationAudioUrl('Connect terminal 3 to terminal 13.wav'),
  '3-5': simulationAudioUrl('Connect terminal 3 to terminal 5..wav'),
  '4-14': simulationAudioUrl('Connect terminal 4 to terminal 14.wav'),
  '6-7': simulationAudioUrl('Connect terminal 6 to terminal 7.wav'),
  '7-9': simulationAudioUrl('Connect terminal 7 to terminal 9.wav'),
  '8-15': simulationAudioUrl('Connect terminal 8 to terminal 15.wav'),
  '10-17': simulationAudioUrl('Connect terminal 10 to terminal 17.wav'),
  '14-17': simulationAudioUrl('Connect terminal 14 to terminal 17.wav'),
  '16-19': simulationAudioUrl('Connect terminal 16 to terminal 19.wav'),
  '18-20': simulationAudioUrl('Connect terminal 18 to terminal 20..wav'),
  '19-21': simulationAudioUrl('Connect terminal 19 to terminal 21.wav'),
  '20-24': simulationAudioUrl('Connect terminal 20 to terminal 24.wav'),
  '22-23': simulationAudioUrl('Connect terminal 22 to terminal 23..wav'),
}
