import SectionCard from './SectionCard.jsx'

const OBSERVATION_ROW_COUNT = 5
const emptyRows = Array.from({ length: OBSERVATION_ROW_COUNT })

const formatNumber = (value, digits) => (
  Number.isFinite(value) ? value.toFixed(digits) : ''
)

const getNumber = (...values) => {
  const value = values.find((currentValue) => Number.isFinite(currentValue))

  return Number.isFinite(value) ? value : undefined
}

const ObservationTable = ({ observations }) => (
  <SectionCard className="h-[250px]" icon="table" id="observation-table-panel" title="OBSERVATION TABLE">
    <div className="observation-table-wrap">
      <table className="observation-table">
        <colgroup>
          <col className="observation-table__col-serial" />
          <col span="3" className="observation-table__col-primary" />
          <col span="3" className="observation-table__col-secondary" />
          <col span="2" className="observation-table__col-result" />
        </colgroup>
        <thead>
          <tr>
            <th className="observation-table__serial" rowSpan="2">S.No</th>
            <th className="observation-table__group" colSpan="3">Primary Side Readings</th>
            <th className="observation-table__group" colSpan="3">Secondary Side Readings</th>
            <th className="observation-table__group" colSpan="2">Results</th>
          </tr>
          <tr>
            <th>V</th>
            <th>A</th>
            <th>W x 2</th>
            <th>V</th>
            <th>A</th>
            <th>W=VA</th>
            <th>VR%</th>
            <th>Eff%</th>
          </tr>
        </thead>
        <tbody>
          {emptyRows.map((_, index) => {
            const row = observations[index]
            const primaryVoltage = row ? getNumber(row.primaryVoltage, row.voltage) : undefined
            const primaryCurrent = row ? getNumber(row.primaryCurrent, row.i1) : undefined
            const primaryPower = row ? getNumber(row.primaryPower) : undefined
            const secondaryVoltage = row ? getNumber(row.secondaryVoltage) : undefined
            const secondaryCurrent = row ? getNumber(row.secondaryCurrent) : undefined
            const secondaryPower = row ? getNumber(row.secondaryPower) : undefined
            const voltageRegulation = row ? getNumber(row.voltageRegulation) : undefined
            const efficiency = row ? getNumber(row.efficiency) : undefined

            return (
              <tr key={index}>
                <td>{row?.id ?? ''}</td>
                <td>{formatNumber(primaryVoltage, 1)}</td>
                <td>{formatNumber(primaryCurrent, 3)}</td>
                <td>{formatNumber(primaryPower, 1)}</td>
                <td>{formatNumber(secondaryVoltage, 1)}</td>
                <td>{formatNumber(secondaryCurrent, 3)}</td>
                <td>{formatNumber(secondaryPower, 1)}</td>
                <td>{formatNumber(voltageRegulation, 1)}</td>
                <td>{formatNumber(efficiency, 1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </SectionCard>
)

export default ObservationTable
