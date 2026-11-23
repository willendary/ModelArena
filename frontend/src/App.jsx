import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Cpu,
  Download,
  Eye,
  Gauge,
  Play,
  RefreshCw,
  Search,
  Square,
  Trash2,
  Trophy,
  Wifi,
} from 'lucide-react'
import { api } from './api'
import { RecommendationHero } from './components/RecommendationHero'
import { RankingBoard } from './components/RankingBoard'
import { RunDetailModal } from './components/RunDetailModal'
import { SchedulePanel } from './components/SchedulePanel'
import { FrontierComparison } from './components/FrontierComparison'

const FALLBACK_CATEGORIES = [
  { id: 'reasoning', label: 'Raciocínio', task_count: 2 },
  { id: 'coding', label: 'Programação (Python & SQL)', task_count: 3 },
  { id: 'debugging', label: 'Debugging', task_count: 2 },
  { id: 'delphi', label: 'Delphi / Pascal', task_count: 2 },
  { id: 'csharp', label: 'C# / .NET', task_count: 2 },
  { id: 'firebird', label: 'Firebird 2.5 SQL', task_count: 2 },
]

export function App() {
  const [health, setHealth] = useState(null)
  const [categoriesMeta, setCategoriesMeta] = useState(FALLBACK_CATEGORIES)
  const [models, setModels] = useState([])
  const [codingOnly, setCodingOnly] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES.map((c) => c.id))
  const [repeats, setRepeats] = useState(1)

  const [ranking, setRanking] = useState([])
  const [rankingCat, setRankingCat] = useState('')
  const [recommendation, setRecommendation] = useState(null)
  const [frontierData, setFrontierData] = useState(null)
  const [history, setHistory] = useState([])
  const [jobs, setJobs] = useState([])
  const [activeJob, setActiveJob] = useState(null)
  const [schedule, setSchedule] = useState(null)

  const [inspectRun, setInspectRun] = useState(null)
  const [tab, setTab] = useState('overview')
  const [message, setMessage] = useState('Carregando estado do ModelArena...')
  const [copiedRef, setCopiedRef] = useState('')
  const [testingConn, setTestingConn] = useState(false)

  async function loadHealthAndMeta() {
    try {
      const [h, cats, sched] = await Promise.all([api.health(), api.categories(), api.getSchedule()])
      setHealth(h)
      if (cats?.data?.length) setCategoriesMeta(cats.data)
      setSchedule(sched)
      if (h.active_provider_mode === 'opencode') {
        setMessage(`Pronto via ${h.active_provider_label} — usando seu OpenChamber sem precisar de NVIDIA_API_KEY.`)
      } else if (!h.provider_ready) {
        setMessage('Nenhum provedor detectado. Abra com OpenChamber instalado ou configure NVIDIA_API_KEY em backend/.env.')
      }
    } catch (e) {
      setMessage(`Backend indisponível: ${e.message}`)
    }
  }

  async function loadModels() {
    try {
      const res = await api.models()
      setModels(res.data || [])
      setMessage(`${res.coding_total ?? res.data?.length ?? 0} modelos de código/chat disponíveis (${res.total ?? 0} totais no provedor NVIDIA).`)
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function refreshData(catFilter = rankingCat) {
    try {
      const [rk, rec, hist, jb, sched, frontier] = await Promise.all([
        api.ranking(catFilter),
        api.recommendation(),
        api.history({ limit: 150 }),
        api.listJobs(15),
        api.getSchedule(),
        api.frontierComparison(),
      ])
      setRanking(rk.data || [])
      setRecommendation(rec)
      setFrontierData(frontier)
      setHistory(hist.data || [])
      const jobList = jb.data || []
      setJobs(jobList)
      setSchedule(sched)
      const running = jobList.find((j) => j.status === 'running' || j.status === 'queued')
      if (running) setActiveJob(running)
    } catch (e) {
      setMessage(e.message)
    }
  }

  useEffect(() => {
    loadHealthAndMeta()
    loadModels()
    refreshData('')
  }, [])

  // Poll active background job until finished
  useEffect(() => {
    if (!activeJob || (activeJob.status !== 'running' && activeJob.status !== 'queued')) return
    const timer = setInterval(async () => {
      try {
        const res = await api.getJob(activeJob.id)
        const updated = res.job
        setActiveJob(updated)
        await refreshData(rankingCat)
        if (updated.status !== 'running' && updated.status !== 'queued') {
          setMessage(
            `Benchmark ${updated.status === 'completed' ? 'concluído' : updated.status}: ` +
              `${updated.succeeded_steps}/${updated.total_steps} execuções com sucesso.`
          )
        }
      } catch {
        clearInterval(timer)
      }
    }, 1500)
    return () => clearInterval(timer)
  }, [activeJob?.id, activeJob?.status, rankingCat])

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    return models.filter((m) => {
      if (codingOnly && m.is_coding_candidate === false) return false
      if (q && !m.id.toLowerCase().includes(q) && !(m.vendor || '').toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [models, codingOnly, search])

  const stats = useMemo(
    () => ({
      count: models.filter((m) => m.is_coding_candidate !== false).length,
      best: ranking[0],
      runs: history.length,
      avg: ranking.length
        ? Math.round(ranking.reduce((a, x) => a + (x.avg_latency_ms || 0), 0) / ranking.length)
        : 0,
    }),
    [models, ranking, history]
  )

  function toggleModel(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function toggleCategory(id) {
    setCategories((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function selectTopCodingPreset() {
    const top = filteredModels.slice(0, 5).map((m) => m.id)
    setSelected(top)
    setMessage(`${top.length} modelo(s) selecionado(s) para comparação rápida.`)
  }

  async function startBenchmark() {
    if (!selected.length || !categories.length) {
      setMessage('Selecione pelo menos um modelo e uma categoria.')
      return
    }
    try {
      const res = await api.startJob({ models: selected, categories, repeats })
      setActiveJob(res.job)
      setMessage(`Benchmark iniciado em background (${res.job.total_steps} avaliações agendadas)...`)
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function cancelActiveJob() {
    if (!activeJob) return
    try {
      await api.cancelJob(activeJob.id)
      setMessage('Solicitado cancelamento do benchmark em andamento...')
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleTestProvider() {
    setTestingConn(true)
    try {
      const res = await api.testProvider(selected[0] || null)
      setMessage(
        `Conexão NVIDIA OK (${res.latency_ms} ms): ${res.coding_models_total} modelos de código disponíveis.` +
          (res.probe ? ` Probe ${res.probe.model}: "${res.probe.response}" (${res.probe.latency_ms} ms).` : '')
      )
      await loadModels()
    } catch (e) {
      setMessage(`Falha na conexão NVIDIA: ${e.message}`)
    } finally {
      setTestingConn(false)
    }
  }

  async function handleOpenRun(id) {
    try {
      const detail = await api.runDetail(id)
      setInspectRun(detail)
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleExportMd() {
    try {
      const md = await api.exportMarkdown()
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelarena-ranking.md'
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Relatório Markdown exportado com sucesso.')
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleSaveSchedule(payload) {
    try {
      const saved = await api.saveSchedule(payload)
      setSchedule(saved)
      setMessage(
        saved.enabled
          ? `Agendamento ativado! Próxima execução em ${new Date(saved.next_run_at).toLocaleString('pt-BR')}.`
          : 'Agendamento salvo (desativado).'
      )
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleRunScheduleNow() {
    try {
      const res = await api.runScheduleNow()
      if (res.job) {
        setActiveJob(res.job)
        setMessage(`Benchmark agendado iniciado agora (${res.job.total_steps} execuções)...`)
      }
    } catch (e) {
      setMessage(e.message)
    }
  }

  async function handleClearHistory() {
    if (!window.confirm('Deseja limpar todo o histórico de execuções e zerar o ranking?')) return
    try {
      const res = await api.clearHistory()
      setMessage(`Histórico limpo (${res.deleted_runs} execuções removidas).`)
      await refreshData(rankingCat)
    } catch (e) {
      setMessage(e.message)
    }
  }

  function handleCopyRef(ref) {
    navigator.clipboard?.writeText(ref).catch(() => {})
    setCopiedRef(ref)
    setMessage(`Referência copiada: ${ref}`)
    setTimeout(() => setCopiedRef(''), 2200)
  }

  async function handleRankingCategoryChange(cat) {
    setRankingCat(cat)
    await refreshData(cat)
  }

  const isRunning = activeJob && (activeJob.status === 'running' || activeJob.status === 'queued')

  return (
    <main>
      <header>
        <div className="brand">
          <div className="logo">
            <Cpu size={22} />
          </div>
          <div>
            <h1>ModelArena</h1>
            <p>Laboratório de benchmark NVIDIA NIM para OpenChamber</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={handleExportMd} title="Exportar relatório Markdown">
            <Download size={14} /> Exportar MD
          </button>
          <div className="provider">
            <span className={health?.provider_ready ? 'dot' : 'dot dot-warn'} />
            <span>{health?.active_provider_label || (health?.provider_ready ? 'NVIDIA' : 'Não configurado')}</span>
            <button
              className="icon"
              disabled={testingConn}
              onClick={handleTestProvider}
              title="Testar conexão com o provedor NVIDIA"
            >
              <Wifi size={15} />
            </button>
            <button className="icon" onClick={loadModels} title="Atualizar catálogo de modelos">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </header>

      <nav>
        {[
          ['overview', 'Ranking & Benchmark'],
          ['frontier', 'vs. Modelos de Ponta'],
          ['models', `Modelos (${filteredModels.length})`],
          ['history', `Histórico & Rubrica (${history.length})`],
          ['schedule', 'Execução Automática'],
        ].map(([id, label]) => (
          <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>
            {label}
          </button>
        ))}
      </nav>

      <div className="notice">{message}</div>

      {isRunning && (
        <section className="job-banner">
          <div className="job-banner-head">
            <div>
              <strong>
                Executando benchmark ({activeJob.completed_steps}/{activeJob.total_steps} ·{' '}
                {activeJob.progress_percent}%)
              </strong>
              <small>
                {activeJob.current_model
                  ? `Agora: ${activeJob.current_model} → ${activeJob.current_category}/${activeJob.current_task_id}`
                  : 'Preparando próxima tarefa...'}
              </small>
            </div>
            <button className="danger-btn" onClick={cancelActiveJob}>
              <Square size={13} /> Cancelar
            </button>
          </div>
          <div className="bar bar-lg">
            <i style={{ width: `${activeJob.progress_percent}%` }} />
          </div>
        </section>
      )}

      {tab === 'overview' && (
        <>
          <RecommendationHero
            recommendation={recommendation}
            copiedRef={copiedRef}
            onCopyRef={handleCopyRef}
          />

          <section className="stats">
            <Stat icon={<Cpu size={20} />} label="Modelos de código" value={stats.count} />
            <Stat
              icon={<Trophy size={20} />}
              label="Melhor pontuação"
              value={stats.best ? `${stats.best.composite_score ?? stats.best.score}/100` : '—'}
            />
            <Stat icon={<Activity size={20} />} label="Avaliações registradas" value={stats.runs} />
            <Stat
              icon={<Gauge size={20} />}
              label="Latência média"
              value={stats.avg ? `${stats.avg} ms` : '—'}
            />
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>Ranking geral atualizado</h2>
                <p>
                  Nota composta (75% qualidade real + 15% confiabilidade + 10% velocidade) com execução real em sandbox Python e SQLite.
                </p>
              </div>
              <button className="secondary" onClick={() => refreshData(rankingCat)}>
                <RefreshCw size={14} /> Atualizar
              </button>
            </div>
            <RankingBoard
              rows={ranking}
              categoryFilter={rankingCat}
              onCategoryFilter={handleRankingCategoryChange}
              copiedRef={copiedRef}
              onCopyRef={handleCopyRef}
            />
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>Executar novo benchmark</h2>
                <p>Mesmas tarefas de programação, SQL, debugging, Delphi, C# e Firebird para todos os modelos.</p>
              </div>
              <div className="btn-row">
                <button className="secondary" onClick={selectTopCodingPreset} disabled={!filteredModels.length}>
                  Selecionar Top 5
                </button>
                <button className="primary" disabled={isRunning} onClick={startBenchmark}>
                  <Play size={15} /> {isRunning ? 'Em andamento...' : `Iniciar (${selected.length})`}
                </button>
              </div>
            </div>

            <div className="search-row">
              <div className="search-input">
                <Search size={15} />
                <input
                  placeholder="Filtrar modelos NVIDIA (ex: glm, nemotron, qwen, deepseek, coder)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={codingOnly}
                  onChange={(e) => setCodingOnly(e.target.checked)}
                />
                Apenas chat/código
              </label>
              {selected.length > 0 && (
                <button className="secondary" onClick={() => setSelected([])}>
                  Limpar seleção ({selected.length})
                </button>
              )}
            </div>

            <div className="model-grid">
              {filteredModels.slice(0, 60).map((m) => (
                <label className={selected.includes(m.id) ? 'model model-selected' : 'model'} key={m.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggleModel(m.id)}
                  />
                  <span>
                    <b>{m.id}</b>
                    <small>
                      {m.vendor || m.owned_by || 'NVIDIA'}
                      {m.tags?.length ? ` · ${m.tags.join(', ')}` : ''}
                    </small>
                  </span>
                </label>
              ))}
              {!filteredModels.length && (
                <p className="empty">Nenhum modelo listado ainda. Clique em atualizar modelos (usa o OpenChamber automaticamente ou NVIDIA_API_KEY opcional).</p>
              )}
            </div>

            <div className="rowline">
              <h3>Suítes de teste ({categories.length} selecionadas)</h3>
              <label className="repeat">
                Repetições
                <select value={repeats} onChange={(e) => setRepeats(Number(e.target.value))}>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                </select>
              </label>
            </div>
            <div className="chips">
              {categoriesMeta.map((cat) => (
                <button
                  key={cat.id}
                  className={categories.includes(cat.id) ? 'chip selected' : 'chip'}
                  onClick={() => toggleCategory(cat.id)}
                  title={cat.description}
                >
                  {cat.label} ({cat.task_count})
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'frontier' && <FrontierComparison data={frontierData} />}

      {tab === 'models' && (
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Catálogo NVIDIA NIM descoberto</h2>
              <p>Classificação automática entre modelos de programação/chat e utilitários (embeddings, rerank, áudio).</p>
            </div>
            <button className="secondary" onClick={loadModels}>
              <RefreshCw size={14} /> Recarregar API
            </button>
          </div>
          <div className="search-row">
            <div className="search-input">
              <Search size={15} />
              <input
                placeholder="Pesquisar por nome ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={codingOnly}
                onChange={(e) => setCodingOnly(e.target.checked)}
              />
              Ocultar embeddings/rerank/áudio
            </label>
          </div>
          <div className="model-grid">
            {filteredModels.map((m) => (
              <div className="model" key={m.id}>
                <Cpu size={16} />
                <span>
                  <b>{m.id}</b>
                  <small>
                    {m.vendor || m.owned_by || 'NVIDIA'} · {m.modality}
                    {m.tags?.length ? ` · ${m.tags.join(', ')}` : ''}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Histórico de avaliações e inspeção de rubrica</h2>
              <p>Clique em qualquer execução para ver o código gerado, os testes unitários executados e cada critério.</p>
            </div>
            <div className="btn-row">
              <button className="secondary" onClick={() => refreshData(rankingCat)}>
                <RefreshCw size={14} /> Atualizar
              </button>
              {history.length > 0 && (
                <button className="danger-btn" onClick={handleClearHistory}>
                  <Trash2 size={14} /> Limpar histórico
                </button>
              )}
            </div>
          </div>
          {!history.length ? (
            <p className="empty">Nenhuma execução registrada ainda.</p>
          ) : (
            history.map((x) => (
              <div className="history clickable" key={x.id} onClick={() => handleOpenRun(x.id)}>
                <span>
                  {x.status === 'success' ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : (
                    <AlertCircle size={16} color="#ef4444" />
                  )}
                </span>
                <b>{x.model_id}</b>
                <span className="tag-pill">{x.category}</span>
                <span className="muted-sm">{x.task_id}</span>
                <span className="score-pill">{x.score}/100</span>
                <span className="muted-sm">
                  {x.tests_total ? `${x.tests_passed}/${x.tests_total} testes` : x.summary || ''}
                </span>
                <span>
                  <Clock3 size={13} /> {Math.round(x.latency_ms || 0)} ms
                </span>
                <button className="ghost-copy" title="Ver detalhes">
                  <Eye size={14} />
                </button>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'schedule' && (
        <SchedulePanel
          schedule={schedule}
          models={models}
          categoriesMeta={categoriesMeta}
          jobs={jobs}
          onSave={handleSaveSchedule}
          onRunNow={handleRunScheduleNow}
        />
      )}

      <RunDetailModal run={inspectRun} onClose={() => setInspectRun(null)} />

      <footer>
        ModelArena v1.1 · Avaliador real (sandbox Python AST/subprocesso + SQLite/Firebird + C#/Delphi) · Funciona direto com OpenChamber (sem API key) ou NVIDIA NIM API
      </footer>
    </main>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}
