import { PdfIcon } from './Icons.jsx'

const ReportControls = ({
  graphGenerated,
  minReadings,
  onGenerateReport,
  readingCount,
  reportGenerated,
}) => {
  const readingsReady = readingCount >= minReadings
  const reportReady = readingsReady && graphGenerated
  const buttonTitle = reportGenerated
    ? 'Report generated. Click to regenerate the report.'
    : reportReady
      ? 'Generate report from the current observations.'
      : readingsReady
        ? 'Generate report after plotting the graph.'
      : `Generate report after ${minReadings} readings.`

  return (
    <button
      id="generate-report-button"
      type="button"
      className="report-button"
      disabled={!reportReady}
      title={buttonTitle}
      aria-label="Generate Report"
      data-report-generated={reportGenerated ? 'true' : 'false'}
      onClick={onGenerateReport}
    >
      <PdfIcon />
      <span>Generate Report</span>
    </button>
  )
}

export default ReportControls
