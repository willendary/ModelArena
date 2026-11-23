import React from 'react'
import { ArrowDownRight, ArrowUpRight, Copy, Check } from 'lucide-react'

const CAT_LABELS = {
  reasoning: 'Raciocínio',
  coding: 'Python/SQL',
  debugging: 'Debug',
  delphi: 'Delphi',
  csharp: 'C#',
  firebird: 'Firebird',
}

export function RankingBoard({ rows, categoryFilter, onCategoryFilter, copiedRef, onCopyRef }) {
  return (
    <div>
      <div className="filter-bar">
        <button
          className={!categoryFilter ? 'chip selected' : 'chip'}
          onClick={() => onCategoryFilter('')}
        >
          Geral (composta)
        </button>
        {Object.entries(CAT_LABELS).map(([id, label]) => (
          <button
            key={id}
            className={categoryFilter === id ? 'chip selected' : 'chip'}
            onClick={() => onCategoryFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {!rows.length ? (
        <p className="empty">Ainda não há resultados para este filtro. Execute um benchmark para gerar o ranking.</p>
      ) : (
        <div className="ranking-list">
          {rows.map((r, i) => {
            const ref = `console-nvidia/${r.model_id}`
            const delta = r.score_delta
            return (
              <div className={i === 0 ? 'rank rank-top' : 'rank'} key={r.model_id}>
                <div className={i === 0 ? 'place place-gold' : 'place'}>{r.rank || i + 1}</div>
                <div className="rank-main">
                  <div className="rank-head">
                    <b>{r.model_id}</b>
                    {delta !== null && delta !== undefined && delta !== 0 && (
                      <span className={delta > 0 ? 'delta up' : 'delta down'}>
                        {delta > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    )}
                    <button
                      className="ghost-copy"
                      onClick={() => onCopyRef(ref)}
                      title={`Copiar ${ref}`}
                    >
                      {copiedRef === ref ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${Math.min(100, Math.max(0, r.composite_score ?? r.score))}%` }} />
                  </div>
                  <div className="rank-meta">
                    <span>Qualidade: <b>{r.quality_score ?? r.score}</b>/100</span>
                    <span>Testes reais: <b>{r.execution_pass_rate !== null && r.execution_pass_rate !== undefined ? `${r.execution_pass_rate}%` : '—'}</b></span>
                    <span>Sucesso: <b>{r.success_rate ?? Math.round((r.successes / Math.max(1, r.runs)) * 100)}%</b> ({r.successes}/{r.runs})</span>
                    <span>Latência: <b>{Math.round(r.avg_latency_ms || 0)} ms</b></span>
                    {r.avg_tokens_per_second ? <span>Vel.: <b>{r.avg_tokens_per_second} tok/s</b></span> : null}
                  </div>
                  {r.category_scores && Object.keys(r.category_scores).length > 0 && (
                    <div className="cat-badges">
                      {Object.entries(r.category_scores).map(([cat, sc]) => (
                        <span className="cat-badge" key={cat}>
                          {CAT_LABELS[cat] || cat}: <b>{sc}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <strong className="score">
                  {r.composite_score ?? r.score}
                  <small>/100</small>
                </strong>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
