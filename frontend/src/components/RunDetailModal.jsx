import React from 'react'
import { CheckCircle2, XCircle, X, Clock3, Cpu } from 'lucide-react'

export function RunDetailModal({ run, onClose }) {
  if (!run) return null
  const evaluation = run.evaluation || null
  const criteria = evaluation?.criteria || []

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-sub">
              <Cpu size={14} /> {run.model_id} · <span>{run.category}</span> · <span>{run.task_id}</span>
            </div>
            <h3>Inspeção da Execução #{run.id}</h3>
          </div>
          <button className="icon" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-kpis">
          <div>
            <small>Nota real</small>
            <strong>{run.score}/100</strong>
          </div>
          <div>
            <small>Testes / Critérios</small>
            <strong>
              {run.tests_total ? `${run.tests_passed}/${run.tests_total}` : '—'}
            </strong>
          </div>
          <div>
            <small>Latência</small>
            <strong>
              <Clock3 size={13} /> {Math.round(run.latency_ms || 0)} ms
            </strong>
          </div>
          <div>
            <small>Velocidade</small>
            <strong>{run.tokens_per_second ? `${run.tokens_per_second} tok/s` : '—'}</strong>
          </div>
        </div>

        {run.error && <div className="error-box">Erro: {run.error}</div>}

        {criteria.length > 0 && (
          <div className="modal-section">
            <h4>Rubrica de avaliação ({evaluation.evaluator_type})</h4>
            <div className="criteria-list">
              {criteria.map((c, idx) => (
                <div className={c.passed ? 'criterion pass' : 'criterion fail'} key={idx}>
                  {c.passed ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                  <div className="criterion-body">
                    <div className="criterion-head">
                      <b>{c.name}</b>
                      <span>
                        {c.earned}/{c.weight} pts
                      </span>
                    </div>
                    <small>{c.detail}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-section">
          <h4>Prompt enviado</h4>
          <pre className="code-box">{run.prompt}</pre>
        </div>

        {evaluation?.code_extracted && (
          <div className="modal-section">
            <h4>Código / resposta extraída para avaliação</h4>
            <pre className="code-box">{evaluation.code_extracted}</pre>
          </div>
        )}

        {run.response && run.response !== evaluation?.code_extracted && (
          <div className="modal-section">
            <h4>Resposta completa do modelo</h4>
            <pre className="code-box">{run.response}</pre>
          </div>
        )}

        {run.reasoning && (
          <div className="modal-section">
            <h4>Traço de raciocínio (&lt;think&gt; / reasoning_content)</h4>
            <pre className="code-box muted-box">{run.reasoning}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
