import React, { useState } from 'react'
import { AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, Info } from 'lucide-react'

const RISK_META = {
  baixo: { badge: 'Baixo risco', cls: 'risk-low' },
  medio: { badge: 'Risco médio', cls: 'risk-mid' },
  'medio-alto': { badge: 'Risco médio-alto', cls: 'risk-mid-high' },
  alto: { badge: 'Risco alto', cls: 'risk-high' },
  'muito-alto': { badge: 'Risco muito alto', cls: 'risk-very-high' },
  indisponivel: { badge: 'Descontinuado', cls: 'risk-dead' },
  desconhecido: { badge: 'Sem ref.', cls: 'risk-dead' },
}

export function FrontierComparison({ data }) {
  const [onlyTested, setOnlyTested] = useState(false)

  if (!data) {
    return (
      <section className="panel">
        <h2>Comparativo vs. Modelos de Ponta</h2>
        <p className="empty">
          O servidor em execução ainda está numa versão anterior à v1.2.0 (sem o endpoint <code>/api/frontier-comparison</code>).
          Assim que seu benchmark atual terminar, reinicie <code>.\scripts\start-modelarena.ps1</code> (seus resultados salvos continuam intactos) e atualize a página!
        </p>
      </section>
    )
  }

  const baselines = data.frontier_baselines || []
  const nvidiaModels = (data.nvidia_models || []).filter((m) => (!onlyTested ? true : m.tested_locally))

  // Unified visual scale combining frontier leaders and NVIDIA models that have SWE-bench Verified scores
  const chartItems = [
    ...baselines.map((b) => ({
      id: b.id,
      label: b.name,
      sub: b.family,
      score: b.swe_bench_verified,
      isFrontier: true,
      estimated: false,
      risk: null,
    })),
    ...nvidiaModels
      .filter((m) => typeof m.swe_bench_verified === 'number')
      .map((m) => ({
        id: m.model_id,
        label: m.model_id,
        sub: `NVIDIA Console · ${m.params}`,
        score: m.swe_bench_verified,
        isFrontier: false,
        estimated: m.swe_bench_estimated,
        risk: m.project_risk,
        localScore: m.local_composite_score,
      })),
  ].sort((a, b) => b.score - a.score)

  return (
    <>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>
              <Sparkles size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
              Comparativo vs. Modelos de Ponta (Referência Externa — {data.metric_name})
            </h2>
            <p>
              Mede a distância real dos modelos NVIDIA do seu OpenChamber em relação a Claude, ChatGPT (GPT-5.6),
              DeepSeek e Gemini em engenharia de software multi-arquivo — sem chamar nenhuma API paga.
            </p>
          </div>
          <span className="tag-pill">Base pública: {data.updated_at}</span>
        </div>

        <div className="callout-info">
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b>Por que um modelo pode tirar 100/100 aqui e mesmo assim bugar um projeto real?</b>
            <p>{data.methodology_note}</p>
          </div>
        </div>

        <h3>Escala visual — {data.metric_name} (Fronteira em azul/roxo vs. NVIDIA Console em verde/laranja)</h3>
        <div className="frontier-chart">
          {chartItems.map((item) => {
            const pct = Math.max(4, Math.min(100, item.score))
            const barClass = item.isFrontier
              ? 'bar-frontier'
              : item.risk === 'baixo'
                ? 'bar-nv-good'
                : item.risk === 'medio' || item.risk === 'medio-alto'
                  ? 'bar-nv-mid'
                  : 'bar-nv-high'
            return (
              <div className="fchart-row" key={item.id}>
                <div className="fchart-label">
                  <div className="fchart-title">
                    <span className={item.isFrontier ? 'f-tag frontier' : 'f-tag nvidia'}>
                      {item.isFrontier ? 'PONTA' : 'NVIDIA'}
                    </span>
                    <b className={item.isFrontier ? '' : 'mono-sm'}>{item.label}</b>
                  </div>
                  <small>
                    {item.sub}
                    {item.localScore !== undefined && item.localScore !== null
                      ? ` · Sua nota local: ${item.localScore}/100`
                      : ''}
                  </small>
                </div>
                <div className="fchart-bar-wrap">
                  <div className="bar bar-lg">
                    <i className={barClass} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <strong className="fchart-val">
                  {item.estimated ? '~' : ''}
                  {item.score.toFixed(1)}%
                </strong>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Diagnóstico de Risco por Modelo NVIDIA (Gap vs. {data.frontier_leader?.name})</h2>
            <p>
              Mostra quantos pontos percentuais cada modelo NVIDIA fica atrás do topo ({data.frontier_leader?.score}%),
              sua nota local medida no ModelArena e quando é seguro deixar o modelo editar seu projeto.
            </p>
          </div>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={onlyTested}
              onChange={(e) => setOnlyTested(e.target.checked)}
            />
            Mostrar apenas modelos já testados localmente
          </label>
        </div>

        <div className="frontier-cards">
          {nvidiaModels.map((m) => {
            const rm = RISK_META[m.project_risk] || RISK_META.desconhecido
            const RiskIcon =
              m.project_risk === 'baixo'
                ? ShieldCheck
                : m.project_risk === 'medio' || m.project_risk === 'medio-alto'
                  ? AlertTriangle
                  : ShieldAlert
            return (
              <article className={`f-card ${rm.cls}`} key={m.model_id}>
                <div className="f-card-head">
                  <div>
                    <b className="mono-md">{m.model_id}</b>
                    <small>
                      {m.display_name} · {m.params} · Contexto: {m.context_window}
                    </small>
                  </div>
                  <span className={`risk-pill ${rm.cls}`}>
                    <RiskIcon size={13} /> {rm.badge}
                  </span>
                </div>

                <div className="f-card-metrics">
                  <div>
                    <small>SWE-bench Verified</small>
                    <strong>
                      {m.swe_bench_verified !== null
                        ? `${m.swe_bench_estimated ? '~' : ''}${m.swe_bench_verified}%`
                        : 'N/D'}
                    </strong>
                  </div>
                  <div>
                    <small>Gap vs. topo ({data.frontier_leader?.score}%)</small>
                    <strong className={m.gap_vs_frontier_pp !== null && m.gap_vs_frontier_pp <= -25 ? 'txt-warn' : ''}>
                      {m.gap_vs_frontier_pp !== null ? `${m.gap_vs_frontier_pp} pts` : m.alt_metric_label || '—'}
                    </strong>
                  </div>
                  <div>
                    <small>% da fronteira</small>
                    <strong>{m.relative_to_frontier_pct !== null ? `${m.relative_to_frontier_pct}%` : '—'}</strong>
                  </div>
                  <div>
                    <small>Sua nota no ModelArena</small>
                    <strong>
                      {m.local_composite_score !== null ? `${m.local_composite_score}/100` : 'Ainda não testado'}
                    </strong>
                  </div>
                </div>

                <p className="f-card-guidance">{m.guidance}</p>
                <div className="f-card-foot">
                  <span>Fonte: {m.source}</span>
                  {m.alt_metric_label && m.alt_metric_score !== null && m.swe_bench_verified === null && (
                    <span>
                      Ref. alternativa: <b>{m.alt_metric_label}: {m.alt_metric_score}%</b>
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
