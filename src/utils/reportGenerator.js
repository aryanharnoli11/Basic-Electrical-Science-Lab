import {
  AUTOTRANSFORMER_OUTPUT_VOLTAGE,
  NO_LOAD_SECONDARY_VOLTAGE,
} from './lampLoadReadings.js'

const GRAPH_VIEWBOX = {
  height: 286,
  width: 650,
}
const GRAPH_PLOT = {
  height: 176,
  left: 80,
  top: 36,
  width: 520,
}
const GRAPH_TICK_COUNT = 5

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const toNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

const toOptionalNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : undefined
}

const formatNumber = (value, fractionDigits = 1) => (
  toNumber(value).toFixed(fractionDigits)
)

const formatResultNumber = (value) => (
  toNumber(value).toFixed(2).replace(/0$/, '')
)

const formatTick = (value) => {
  if (Math.abs(value) >= 100) {
    return value.toFixed(0)
  }

  return value.toFixed(1).replace(/\.0$/, '')
}

const getSessionDurationText = (sessionStart, sessionEnd) => {
  const durationMs = Math.max(0, sessionEnd - sessionStart)
  const durationTotalSeconds = Math.floor(durationMs / 1000)
  const durationMinutes = Math.floor(durationTotalSeconds / 60)
  const durationSeconds = durationTotalSeconds % 60

  return `${durationMinutes} min ${String(durationSeconds).padStart(2, '0')} sec`
}

const getNiceStep = (roughStep) => {
  if (roughStep <= 0) {
    return 1
  }

  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalizedStep = roughStep / magnitude
  const niceStep = (
    normalizedStep <= 1 ? 1
      : normalizedStep <= 2 ? 2
        : normalizedStep <= 2.5 ? 2.5
          : normalizedStep <= 5 ? 5
            : 10
  )

  return niceStep * magnitude
}

const getNiceMaximum = (values) => {
  const maxValue = Math.max(0, ...values)
  const paddedMax = maxValue > 0 ? maxValue * 1.08 : 1
  const step = getNiceStep(paddedMax / (GRAPH_TICK_COUNT - 1))

  return step * (GRAPH_TICK_COUNT - 1)
}

const getTicks = (maxValue) => (
  Array.from({ length: GRAPH_TICK_COUNT }, (_, index) => (
    (maxValue / (GRAPH_TICK_COUNT - 1)) * index
  ))
)

const getGraphData = (observations, valueKey) => (
  observations
    .map((row) => {
      const outputPower = toOptionalNumber(row.secondaryPower)
      const value = toOptionalNumber(row[valueKey])

      if (!Number.isFinite(outputPower) || !Number.isFinite(value)) {
        return null
      }

      return { outputPower, value }
    })
    .filter(Boolean)
    .sort((current, next) => current.outputPower - next.outputPower)
)

const getChartPoint = (point, xMax, yMax) => ({
  ...point,
  x: GRAPH_PLOT.left + (point.outputPower / xMax) * GRAPH_PLOT.width,
  y: GRAPH_PLOT.top + GRAPH_PLOT.height - (point.value / yMax) * GRAPH_PLOT.height,
})

const getSmoothPath = (points) => {
  if (points.length === 0) {
    return ''
  }

  if (points.length === 1) {
    return `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  }

  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] ?? point
    const next = points[index + 1]
    const afterNext = points[index + 2] ?? next
    const controlOneX = point.x + (next.x - previous.x) / 6
    const controlOneY = point.y + (next.y - previous.y) / 6
    const controlTwoX = next.x - (afterNext.x - point.x) / 6
    const controlTwoY = next.y - (afterNext.y - point.y) / 6

    return `${path} C${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`
  }, `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`)
}

const createReportGraphSvg = ({
  ariaLabel,
  color,
  points,
  title,
  yAxisLabel,
}) => {
  if (!points.length) {
    return '<em>No valid readings available to plot.</em>'
  }

  const chartRight = GRAPH_PLOT.left + GRAPH_PLOT.width
  const chartBottom = GRAPH_PLOT.top + GRAPH_PLOT.height
  const xMax = getNiceMaximum(points.map((point) => point.outputPower))
  const yMax = getNiceMaximum(points.map((point) => point.value))
  const xTicks = getTicks(xMax)
  const yTicks = getTicks(yMax)
  const chartPoints = points.map((point) => getChartPoint(point, xMax, yMax))
  const linePath = getSmoothPath(chartPoints)
  const chartId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const clipId = `${chartId}-clip`

  const xTickMarkup = xTicks.map((tick) => {
    const x = GRAPH_PLOT.left + (tick / xMax) * GRAPH_PLOT.width

    return `
      <g>
        <line class="report-graph__grid" x1="${x}" x2="${x}" y1="${GRAPH_PLOT.top}" y2="${chartBottom}" />
        <line class="report-graph__tick" x1="${x}" x2="${x}" y1="${chartBottom}" y2="${chartBottom + 6}" />
        <text class="report-graph__tick-label" text-anchor="middle" x="${x}" y="${chartBottom + 24}">${formatTick(tick)}</text>
      </g>
    `
  }).join('')

  const yTickMarkup = yTicks.map((tick) => {
    const y = GRAPH_PLOT.top + GRAPH_PLOT.height - (tick / yMax) * GRAPH_PLOT.height

    return `
      <g>
        <line class="report-graph__grid report-graph__grid--horizontal" x1="${GRAPH_PLOT.left}" x2="${chartRight}" y1="${y}" y2="${y}" />
        <line class="report-graph__tick" x1="${GRAPH_PLOT.left - 6}" x2="${GRAPH_PLOT.left}" y1="${y}" y2="${y}" />
        <text class="report-graph__tick-label report-graph__tick-label--y" text-anchor="end" x="${GRAPH_PLOT.left - 12}" y="${y + 4}">${formatTick(tick)}</text>
      </g>
    `
  }).join('')

  const pointMarkup = chartPoints.map((point) => (
    `<circle class="report-graph__point" cx="${point.x}" cy="${point.y}" r="4.5">
      <title>Output Power: ${formatNumber(point.outputPower, 1)} W; ${escapeHtml(yAxisLabel)}: ${formatResultNumber(point.value)}</title>
    </circle>`
  )).join('')

  return `
    <svg
      class="report-graph__svg"
      role="img"
      aria-label="${escapeHtml(ariaLabel)}"
      viewBox="0 0 ${GRAPH_VIEWBOX.width} ${GRAPH_VIEWBOX.height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          <![CDATA[
            .report-graph__plot-bg { fill: #fffdf8; stroke: rgba(112, 82, 55, 0.28); stroke-width: 1; }
            .report-graph__grid { stroke: rgba(117, 88, 62, 0.2); stroke-width: 0.8; }
            .report-graph__grid--horizontal { stroke-dasharray: 4 8; }
            .report-graph__axis { fill: none; stroke: #563927; stroke-linecap: round; stroke-width: 1.25; }
            .report-graph__tick { stroke: rgba(74, 43, 31, 0.38); stroke-linecap: round; stroke-width: 1; }
            .report-graph__tick-label { fill: #6a4b34; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 800; }
            .report-graph__tick-label--y { font-size: 11px; }
            .report-graph__axis-title { fill: #38271c; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 900; }
            .report-graph__line { fill: none; stroke: ${color}; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.6; }
            .report-graph__point { fill: #ffffff; stroke: ${color}; stroke-width: 2; }
          ]]>
        </style>
        <clipPath id="${clipId}">
          <rect height="${GRAPH_PLOT.height}" width="${GRAPH_PLOT.width}" x="${GRAPH_PLOT.left}" y="${GRAPH_PLOT.top}" />
        </clipPath>
      </defs>

      <rect class="report-graph__plot-bg" height="${GRAPH_PLOT.height}" width="${GRAPH_PLOT.width}" x="${GRAPH_PLOT.left}" y="${GRAPH_PLOT.top}" />
      ${xTickMarkup}
      ${yTickMarkup}

      <path class="report-graph__axis" d="M${GRAPH_PLOT.left} ${chartBottom}H${chartRight}" />
      <path class="report-graph__axis" d="M${GRAPH_PLOT.left} ${chartBottom}V${GRAPH_PLOT.top}" />

      <text class="report-graph__axis-title" text-anchor="middle" x="${GRAPH_PLOT.left + GRAPH_PLOT.width / 2}" y="${GRAPH_VIEWBOX.height - 10}">
        Output Power (W)
      </text>
      <text
        class="report-graph__axis-title"
        text-anchor="middle"
        transform="rotate(-90 24 ${GRAPH_PLOT.top + GRAPH_PLOT.height / 2})"
        x="24"
        y="${GRAPH_PLOT.top + GRAPH_PLOT.height / 2}"
      >
        ${escapeHtml(yAxisLabel)}
      </text>

      <g clip-path="url(#${clipId})">
        <path class="report-graph__line" d="${linePath}" />
      </g>
      <g>
        ${pointMarkup}
      </g>
    </svg>
  `
}

const createObservationRows = (observations) => (
  observations.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${formatNumber(row.primaryVoltage, 1)}</td>
      <td>${formatNumber(row.primaryCurrent, 3)}</td>
      <td>${formatNumber(row.primaryPower, 1)}</td>
      <td>${formatNumber(row.secondaryVoltage, 1)}</td>
      <td>${formatNumber(row.secondaryCurrent, 3)}</td>
      <td>${formatNumber(row.secondaryPower, 1)}</td>
      <td>${formatResultNumber(row.voltageRegulation)}</td>
      <td>${formatResultNumber(row.efficiency)}</td>
    </tr>
  `).join('')
)

const getBestObservation = (observations, key) => (
  observations.reduce((best, row) => (
    toNumber(row[key]) > toNumber(best?.[key]) ? row : best
  ), observations[0])
)

const getFullLoadObservation = (observations) => (
  [...observations].sort((current, next) => toNumber(next.secondaryPower) - toNumber(current.secondaryPower))[0]
)

const createSummaryRows = (observations) => {
  const highestEfficiencyRow = getBestObservation(observations, 'efficiency')
  const fullLoadRow = getFullLoadObservation(observations)
  const maxOutputPower = Math.max(0, ...observations.map((row) => toNumber(row.secondaryPower)))

  return `
    <tr><th>Readings Recorded</th><td>${observations.length}</td></tr>
    <tr><th>Rated Primary Voltage Used</th><td>${formatNumber(AUTOTRANSFORMER_OUTPUT_VOLTAGE, 1)} V</td></tr>
    <tr><th>No-load Secondary Voltage</th><td>${formatNumber(NO_LOAD_SECONDARY_VOLTAGE, 1)} V</td></tr>
    <tr><th>Maximum Output Power</th><td>${formatNumber(maxOutputPower, 1)} W</td></tr>
    <tr><th>Maximum Efficiency</th><td>${formatResultNumber(highestEfficiencyRow?.efficiency)}% at ${formatNumber(highestEfficiencyRow?.secondaryPower, 1)} W</td></tr>
    <tr><th>Full-load Efficiency</th><td>${formatResultNumber(fullLoadRow?.efficiency)}%</td></tr>
    <tr><th>Full-load Voltage Regulation</th><td>${formatResultNumber(fullLoadRow?.voltageRegulation)}%</td></tr>
  `
}

const createReportHtml = ({
  baseHref,
  iitLogoSrc,
  observations,
  sessionStart,
  virtualLabsLogoSrc,
}) => {
  const reportDate = new Date()
  const sessionEnd = reportDate.getTime()
  const reportDateText = reportDate.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const startTimeText = new Date(sessionStart).toLocaleTimeString()
  const endTimeText = reportDate.toLocaleTimeString()
  const durationText = getSessionDurationText(sessionStart, sessionEnd)
  const fullLoadRow = getFullLoadObservation(observations)
  const observationRows = createObservationRows(observations)
  const summaryRows = createSummaryRows(observations)
  const efficiencyGraphSvg = createReportGraphSvg({
    ariaLabel: 'Efficiency versus output power graph',
    color: '#0f766e',
    points: getGraphData(observations, 'efficiency'),
    title: 'Efficiency vs Output Power',
    yAxisLabel: 'Efficiency (%)',
  })
  const regulationGraphSvg = createReportGraphSvg({
    ariaLabel: 'Voltage regulation versus output power graph',
    color: '#b45309',
    points: getGraphData(observations, 'voltageRegulation'),
    title: 'Voltage Regulation vs Output Power',
    yAxisLabel: 'Voltage Regulation (%)',
  })

  const css = `
body {
  margin: 0;
  padding: 18px 14px 30px;
  background: linear-gradient(180deg, #eef4fb 0%, #f7f9fc 100%);
  color: #1f2d3d;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.42;
  overflow-wrap: break-word;
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
.report-page {
  width: min(100%, 980px);
  margin: 0 auto 18px;
  padding: 22px 26px;
  overflow: visible;
  border: 1px solid #d3ddea;
  border-radius: 16px;
  background-color: #ffffff;
  box-shadow: 0 12px 28px rgba(23, 50, 77, 0.1);
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.report-page:last-of-type {
  margin-bottom: 0;
}
.report-page--results,
.report-page--graphs {
  break-before: page;
  page-break-before: always;
}
h1,
h2,
h3 {
  margin-top: 0;
  color: #1f2d3d;
  font-weight: 700;
}
h1 {
  margin: 0;
  font-size: 25px;
  line-height: 1.15;
}
h2 {
  margin-bottom: 12px;
  color: #243b53;
  font-size: 20px;
}
h3 {
  margin-bottom: 7px;
  color: #2d4b68;
  font-size: 15px;
}
p {
  margin: 0 0 8px;
}
li {
  margin-bottom: 4px;
}
ul,
ol {
  margin: 7px 0 0;
  padding-left: 20px;
}
.section {
  margin-bottom: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f9fbfe 0%, #f4f7fb 100%);
}
.section:last-child {
  margin-bottom: 0;
}
.section > h2:first-child {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e1e9f3;
}
.header-row {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) 108px;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.report-title-block {
  min-width: 0;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 3px solid #2f7bfa;
  text-align: center;
}
.report-subtitle {
  margin: 6px 0 0;
  color: #5c6f84;
  font-size: 13px;
}
.report-logo {
  width: auto;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
  justify-self: center;
}
.report-logo--virtual-labs {
  max-width: 190px;
  max-height: 86px;
  justify-self: start;
}
.report-logo--iit {
  max-width: 88px;
  max-height: 88px;
  justify-self: end;
}
.report-overview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.badge,
.report-stamp {
  margin: 0;
  padding: 7px 12px;
  border-radius: 20px;
  background: #e8f1ff;
  color: #1f62d0;
  font-size: 12px;
  font-weight: 700;
}
.report-stamp {
  background: #ffffff;
  color: #50657c;
  font-size: 13px;
}
.report-experiment-label {
  margin: 0 0 6px;
  color: #60778f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
.report-experiment-title {
  margin: 0 0 14px;
  color: #16324b;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.info-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #fff;
  font-size: 13px;
}
.label {
  color: #1f2d3d;
  font-weight: 700;
}
.two-column-list {
  column-count: 2;
  column-gap: 32px;
  list-style-position: inside;
  margin-top: 10px;
}
.table-shell {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  border-radius: 12px;
  background: #ffffff;
}
table {
  width: 100%;
  margin-top: 0;
  border-collapse: collapse;
  background-color: white;
  table-layout: auto;
}
th,
td {
  padding: 8px 9px;
  border: 1px solid #d9e2ec;
  font-size: 12.5px;
  text-align: center;
  vertical-align: middle;
  overflow-wrap: anywhere;
  word-break: break-word;
}
th {
  border-color: #c6d7ec;
  border-bottom-color: #b4cae5;
  color: white;
  background: linear-gradient(135deg, #2f7bfa 0%, #1f62d0 100%);
  font-weight: 700;
}
thead {
  display: table-header-group;
}
tbody {
  display: table-row-group;
}
tr {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
tr:nth-child(even) {
  background-color: #f8fbff;
}
.results-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.results-card {
  display: flex;
  width: 100%;
  max-width: 100%;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
  overflow: visible;
  border-radius: 12px;
  background: #ffffff;
}
.results-card h3 {
  margin: 0;
  text-align: left;
}
.summary-table th {
  width: 35%;
}
.graphs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.report-graph-card {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.report-graph {
  display: flex;
  min-height: 310px;
  align-items: flex-start;
  justify-content: center;
  padding: 8px 0 0;
  overflow: visible;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef5fb 100%);
}
.report-graph > * {
  max-width: 100%;
}
.report-graph em {
  color: #5e738c;
  font-style: normal;
  font-weight: 700;
}
.report-graph__image,
.report-graph__svg {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}
.report-graph__svg {
  font-family: Arial, Helvetica, sans-serif;
  shape-rendering: geometricPrecision;
  text-rendering: optimizeLegibility;
}
.report-graph__plot-bg {
  fill: #fffdf8;
  stroke: rgba(112, 82, 55, 0.28);
  stroke-width: 1;
}
.report-graph__grid {
  stroke: rgba(117, 88, 62, 0.2);
  stroke-width: 0.8;
}
.report-graph__grid--horizontal {
  stroke-dasharray: 4 8;
}
.report-graph__axis {
  fill: none;
  stroke: #563927;
  stroke-linecap: round;
  stroke-width: 1.25;
}
.report-graph__tick {
  stroke: rgba(74, 43, 31, 0.38);
  stroke-linecap: round;
  stroke-width: 1;
}
.report-graph__tick-label {
  fill: #6a4b34;
  font-size: 12px;
  font-weight: 800;
}
.report-graph__tick-label--y {
  font-size: 11px;
}
.report-graph__axis-title {
  fill: #38271c;
  font-size: 14px;
  font-weight: 900;
}
.report-graph__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.6;
}
.report-graph__point {
  fill: #ffffff;
  stroke: var(--report-graph-color);
  stroke-width: 2;
}
.report-actions {
  display: flex;
  width: min(100%, 980px);
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px auto 0;
}
.print-btn,
.download-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.25s ease;
}
.print-btn {
  background: linear-gradient(to right, #2f7bfa, #1f62d0);
}
.download-btn {
  background: linear-gradient(to right, #28a745, #1f8d38);
}
.print-btn:hover,
.download-btn:hover {
  box-shadow: 0 6px 14px rgba(31, 45, 61, 0.12);
  transform: translateY(-2px);
}
.pdf-exporting .report-page {
  margin-bottom: 0 !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
.pdf-exporting .section,
.pdf-exporting .results-card,
.pdf-exporting .table-shell,
.pdf-exporting .report-graph {
  overflow: visible !important;
}
.pdf-exporting .report-page--overview,
.pdf-exporting .report-page--results {
  break-after: page !important;
  page-break-after: always !important;
}
@media (max-width: 768px) {
  body {
    padding: 20px 14px 30px;
  }
  .report-page {
    margin-bottom: 18px;
    padding: 20px 18px;
    border-radius: 16px;
  }
  .header-row {
    grid-template-columns: 1fr;
    gap: 14px;
    text-align: center;
  }
  .report-logo,
  .report-logo--virtual-labs,
  .report-logo--iit {
    max-height: 72px;
    justify-self: center;
  }
  .two-column-list {
    column-count: 1;
    column-gap: 0;
  }
  .graphs-grid {
    grid-template-columns: 1fr;
  }
  th,
  td {
    padding: 8px;
    font-size: 12px;
  }
  .report-actions {
    justify-content: center;
  }
}
@media print {
  @page {
    size: A4;
    margin: 12mm;
  }
  .print-btn,
  .download-btn,
  .report-actions {
    display: none;
  }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  .report-page {
    width: 100%;
    margin: 0;
    padding: 16px 18px;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
  .header-row {
    grid-template-columns: 150px minmax(0, 1fr) 86px;
    gap: 16px;
  }
  .report-experiment-title {
    font-size: 22px;
  }
  .section,
  .header-row,
  .info-grid,
  .report-graph-card,
  .report-graph,
  thead,
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .graphs-grid {
    grid-template-columns: 1fr;
  }
}
  `

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transformer Load Test Simulation Report</title>
  <base href="${escapeHtml(baseHref)}">
  <style>${css}</style>
</head>
<body id="report-root">
  <main class="report-document" id="report-document">
    <div class="report-page report-page--overview">
      <div class="header-row">
        <img src="${escapeHtml(virtualLabsLogoSrc)}" class="report-logo report-logo--virtual-labs" alt="Virtual Labs logo">
        <div class="report-title-block">
          <h1>Virtual Labs Simulation Report</h1>
          <p class="report-subtitle">Basic Electrical Science Lab</p>
        </div>
        <img src="${escapeHtml(iitLogoSrc)}" class="report-logo report-logo--iit" alt="Indian Institute of Technology Roorkee logo">
      </div>

      <div class="section report-overview">
        <div class="report-overview-top">
          <p class="badge">Basic Electrical Science Lab</p>
          <p class="report-stamp">Generated on ${escapeHtml(reportDateText)}</p>
        </div>
        <p class="report-experiment-label">Experiment Title</p>
        <p class="report-experiment-title">To Study the Efficiency of Single Phase Transformer by Load Test</p>
        <div class="info-grid">
          <div class="info-card"><span class="label">Start Time:</span>${escapeHtml(startTimeText)}</div>
          <div class="info-card"><span class="label">End Time:</span>${escapeHtml(endTimeText)}</div>
          <div class="info-card"><span class="label">Total Time Spent:</span>${escapeHtml(durationText)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Experiment Summary</h2>
        <h3>Aim</h3>
        <p style="text-align: justify;">To determine the efficiency and voltage regulation of a single phase transformer by performing a load test at different lamp-load conditions.</p>

        <h3>Theory</h3>
        <p style="text-align: justify;">In a transformer load test, the primary side input power and the secondary side output power are measured for increasing load. The secondary output power is obtained from W = VA for the lamp load. Efficiency is the ratio of output power to input power, expressed as a percentage. Voltage regulation indicates the change in secondary terminal voltage from no-load to load condition.</p>

        <h3>Apparatus and Parameters</h3>
        <ul class="two-column-list">
          <li>Single phase transformer</li>
          <li>Autotransformer set to ${formatNumber(AUTOTRANSFORMER_OUTPUT_VOLTAGE, 1)} V</li>
          <li>AC voltmeters for primary and secondary voltage</li>
          <li>AC ammeters for primary and secondary current</li>
          <li>Wattmeter on primary side</li>
          <li>Lamp load bank</li>
          <li>No-load secondary voltage: ${formatNumber(NO_LOAD_SECONDARY_VOLTAGE, 1)} V</li>
          <li>Connecting leads</li>
        </ul>

        <h3>Calculation Formulae</h3>
        <ul>
          <li>Input power, W<sub>in</sub> = wattmeter reading x 2</li>
          <li>Output power, W<sub>out</sub> = V<sub>2</sub> x I<sub>2</sub></li>
          <li>Efficiency, eta = (W<sub>out</sub> / W<sub>in</sub>) x 100%</li>
          <li>Voltage regulation = ((V<sub>no-load</sub> - V<sub>load</sub>) / V<sub>load</sub>) x 100%</li>
        </ul>
      </div>
    </div>

    <div class="report-page report-page--results">
      <div class="section results-section">
        <h2>Observations and Results</h2>
        <div class="results-stack">
          <div class="results-card results-card--table">
            <h3>Observation Table</h3>
            <div class="table-shell">
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">S.No.</th>
                    <th colspan="3">Primary Side Readings</th>
                    <th colspan="3">Secondary Side Readings</th>
                    <th colspan="2">Results</th>
                  </tr>
                  <tr>
                    <th>V</th>
                    <th>A</th>
                    <th>W x 2</th>
                    <th>V</th>
                    <th>A</th>
                    <th>W = VA</th>
                    <th>VR%</th>
                    <th>Eff%</th>
                  </tr>
                </thead>
                <tbody>${observationRows}</tbody>
              </table>
            </div>
          </div>

          <div class="results-card">
            <h3>Result Summary</h3>
            <div class="table-shell">
              <table class="summary-table">
                <tbody>${summaryRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="report-page report-page--graphs">
      <div class="section results-section">
        <h2>Graphs and Conclusion</h2>
        <div class="graphs-grid">
          <div class="results-card report-graph-card">
            <h3>Efficiency vs Output Power</h3>
            <div class="report-graph">${efficiencyGraphSvg}</div>
          </div>
          <div class="results-card report-graph-card">
            <h3>Voltage Regulation vs Output Power</h3>
            <div class="report-graph">${regulationGraphSvg}</div>
          </div>
        </div>

        <div class="results-card">
          <h3>Conclusion</h3>
          <p style="text-align: justify;">The transformer load-test observations show how efficiency and voltage regulation vary with output power. At the highest recorded load of ${formatNumber(fullLoadRow?.secondaryPower, 1)} W, the simulated transformer efficiency is ${formatResultNumber(fullLoadRow?.efficiency)}% and the voltage regulation is ${formatResultNumber(fullLoadRow?.voltageRegulation)}%.</p>
        </div>
      </div>
    </div>
  </main>

  <div class="report-actions" data-html2canvas-ignore="true">
    <button class="print-btn" type="button" onclick="window.print()">PRINT</button>
    <button class="download-btn" type="button" onclick="downloadReport()">DOWNLOAD REPORT</button>
  </div>

  <script>
    function ensureHtml2Pdf() {
      return new Promise(function(resolve, reject) {
        if (window.html2pdf) return resolve();
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    function prepareReportGraphImages() {
      var graphContainers = Array.from(document.querySelectorAll('.report-graph'));

      return Promise.all(graphContainers.map(function(graphContainer) {
        return new Promise(function(resolve) {
          var svg = graphContainer.querySelector('svg');

          if (!svg) return resolve();

          try {
            var viewBox = svg.viewBox && svg.viewBox.baseVal;
            var width = viewBox && viewBox.width ? viewBox.width : 650;
            var height = viewBox && viewBox.height ? viewBox.height : 286;
            var svgText = new XMLSerializer().serializeToString(svg);
            var svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            var svgUrl = URL.createObjectURL(svgBlob);
            var image = new Image();

            image.onload = function() {
              var canvas = document.createElement('canvas');
              var scale = 2;
              canvas.width = width * scale;
              canvas.height = height * scale;

              var context = canvas.getContext('2d');
              context.fillStyle = '#f8fbfe';
              context.fillRect(0, 0, canvas.width, canvas.height);
              context.drawImage(image, 0, 0, canvas.width, canvas.height);

              var png = new Image();
              png.className = 'report-graph__image';
              png.alt = svg.getAttribute('aria-label') || 'Transformer load-test result graph';
              png.src = canvas.toDataURL('image/png');
              graphContainer.innerHTML = '';
              graphContainer.appendChild(png);

              URL.revokeObjectURL(svgUrl);
              resolve();
            };

            image.onerror = function() {
              URL.revokeObjectURL(svgUrl);
              resolve();
            };

            image.src = svgUrl;
          } catch {
            resolve();
          }
        });
      }));
    }

    function downloadReport() {
      prepareReportGraphImages().then(ensureHtml2Pdf).then(function() {
        var element = document.getElementById('report-document') || document.body;
        var opts = {
          margin: [0.18, 0.18, 0.18, 0.18],
          filename: 'transformer-load-test-report.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            onclone: function(clonedDoc) {
              clonedDoc.body.classList.add('pdf-exporting');
            }
          },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
          pagebreak: {
            mode: ['css', 'legacy'],
            before: ['.report-page--results', '.report-page--graphs'],
            avoid: ['.report-page', '.header-row', '.report-overview', '.info-grid', '.report-graph-card', 'thead', 'tr']
          }
        };
        return window.html2pdf().set(opts).from(element).save();
      }).catch(function() {
        alert('Unable to download the report automatically. Please use your browser\\'s Save as PDF option.');
      });
    }
  </script>
</body>
</html>
  `
}

export const generateTransformerReport = ({ observations, sessionStart }) => {
  const baseHref = new URL(import.meta.env.BASE_URL, window.location.origin).href
  const iitLogoSrc = new URL('../assets/IIT Logo.png', import.meta.url).href
  const virtualLabsLogoSrc = new URL('../assets/image.png', import.meta.url).href
  const reportHtml = createReportHtml({
    baseHref,
    iitLogoSrc,
    observations,
    sessionStart,
    virtualLabsLogoSrc,
  })
  const reportBlob = new Blob([reportHtml], { type: 'text/html' })
  const reportUrl = URL.createObjectURL(reportBlob)
  const reportWindow = window.open(reportUrl, '_blank')

  if (!reportWindow) {
    URL.revokeObjectURL(reportUrl)
    return false
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(reportUrl)
  }, 60000)
  reportWindow.focus()

  return true
}
