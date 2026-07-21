import SectionCard from './SectionCard.jsx'

const FormulaSection = () => (
  <SectionCard className="formula-section-card" icon="formula" id="formula-section-panel" title="FORMULAS">
    <div className="formula-section" aria-label="Formula section">
      <div className="formula-section__list">
        <div className="formula-section__item">
          <span className="formula-section__name">Voltage Regulation (%)</span>
          <span className="formula-section__equals">=</span>
          <span className="formula-fraction">
            <span className="formula-fraction__top">
              V<sub>no-load</sub> - V<sub>full-load</sub>
            </span>
            <span className="formula-fraction__bar" />
            <span className="formula-fraction__bottom">
              V<sub>full-load</sub>
            </span>
          </span>
          <span className="formula-section__multiplier">x 100</span>
        </div>
        <div className="formula-section__item">
          <span className="formula-section__name">Efficiency η (%)</span>
          <span className="formula-section__equals">=</span>
          <span className="formula-fraction">
            <span className="formula-fraction__top">Output Power</span>
            <span className="formula-fraction__bar" />
            <span className="formula-fraction__bottom">Input Power</span>
          </span>
          <span className="formula-section__multiplier">x 100</span>
        </div>
      </div>
    </div>
  </SectionCard>
)

export default FormulaSection
