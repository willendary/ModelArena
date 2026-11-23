import React from 'react'
import { Award, Copy, Zap, Check } from 'lucide-react'

export function RecommendationHero({ recommendation, copiedRef, onCopyRef }) {
  if (!recommendation || !recommendation.has_data || !recommendation.primary_coding_model) {
    return (
      <section className="hero hero-empty">
        <div className="hero-badge">
          <Award size={16} /> Recomendação de Modelo Principal
        </div>
        <h2>Descubra qual modelo NVIDIA merece ser seu principal no OpenChamber</h2>
        <p>
          Selecione 2 ou mais modelos NVIDIA abaixo e execute o benchmark. O ModelArena roda testes unitários
          reais em sandbox Python, consultas reais em SQLite/Firebird e análise estrutural de C# e Delphi.
        </p>
      </section>
    )
  }

  const winner = recommendation.primary_coding_model
  const fastest = recommendation.fastest_reliable_model
  const byCat = Object.values(recommendation.best_by_category || {})

  return (
    <section className="hero">
      <div className="hero-top">
        <div>
          <div className="hero-badge">
            <Award size={15} /> Modelo Principal Recomendado para Programação
          </div>
          <h2 className="hero-model">{winner.model_id}</h2>
          <p className="hero-rationale">{winner.rationale}</p>
        </div>
        <div className="hero-score-box">
          <span className="hero-score-label">Pontuação composta</span>
          <strong>
            {winner.composite_score}
            <small>/100</small>
          </strong>
          <button
            className="primary small-btn"
            onClick={() => onCopyRef(winner.openchamber_model_ref)}
            title="Copiar referência para o OpenChamber"
          >
            {copiedRef === winner.openchamber_model_ref ? <Check size={14} /> : <Copy size={14} />}
            {copiedRef === winner.openchamber_model_ref ? 'Copiado!' : 'Copiar para OpenChamber'}
          </button>
        </div>
      </div>

      <div className="hero-metrics">
        <div className="pill-metric">
          <span>Qualidade real</span>
          <b>{winner.quality_score}/100</b>
        </div>
        <div className="pill-metric">
          <span>Testes aprovados</span>
          <b>{winner.execution_pass_rate !== null ? `${winner.execution_pass_rate}%` : '—'}</b>
        </div>
        <div className="pill-metric">
          <span>Confiabilidade</span>
          <b>{winner.success_rate}%</b>
        </div>
        <div className="pill-metric">
          <span>Latência média</span>
          <b>{Math.round(winner.avg_latency_ms || 0)} ms</b>
        </div>
        {fastest && (
          <div className="pill-metric pill-fast">
            <span>
              <Zap size={12} /> Mais rápido confiável
            </span>
            <b>
              {fastest.model_id} ({Math.round(fastest.avg_latency_ms)} ms)
            </b>
          </div>
        )}
      </div>

      {byCat.length > 0 && (
        <div className="cat-winners">
          {byCat.map((item) => (
            <div className="cat-winner-card" key={item.category_id}>
              <small>{item.category_label}</small>
              <strong>{item.model_id}</strong>
              <span>{item.score}/100</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
