import React, { useEffect, useState } from 'react'
import { CalendarClock, Play, Save } from 'lucide-react'

const INTERVAL_OPTIONS = [
  { value: 60, label: 'A cada 1 hora' },
  { value: 180, label: 'A cada 3 horas' },
  { value: 360, label: 'A cada 6 horas' },
  { value: 720, label: 'A cada 12 horas' },
  { value: 1440, label: 'Diariamente (24h)' },
]

export function SchedulePanel({
  schedule,
  models,
  categoriesMeta,
  jobs,
  onSave,
  onRunNow,
}) {
  const [form, setForm] = useState({
    enabled: false,
    interval_minutes: 360,
    model_selection_mode: 'auto_coding',
    max_auto_models: 5,
    models: [],
    categories: ['reasoning', 'coding', 'debugging', 'delphi', 'csharp', 'firebird'],
    repeats: 1,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (schedule) {
      setForm({
        enabled: !!schedule.enabled,
        interval_minutes: schedule.interval_minutes || 360,
        model_selection_mode: schedule.model_selection_mode || 'manual',
        max_auto_models: schedule.max_auto_models || 5,
        models: schedule.models || [],
        categories: schedule.categories || ['reasoning', 'coding', 'debugging', 'delphi', 'csharp', 'firebird'],
        repeats: schedule.repeats || 1,
      })
    }
  }, [schedule])

  function toggleCategory(id) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter((c) => c !== id)
        : [...f.categories, id],
    }))
  }

  function toggleModel(id) {
    setForm((f) => ({
      ...f,
      models: f.models.includes(id) ? f.models.filter((m) => m !== id) : [...f.models, id],
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const codingModels = models.filter((m) => m.is_coding_candidate !== false)

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>
            <CalendarClock size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
            Execução Automática e Ranking Atualizado
          </h2>
          <p>
            Mantém o ranking dos modelos NVIDIA sempre atualizado periodicamente em background (também acionável pelo OpenChamber).
          </p>
        </div>
        <div className="btn-row">
          <button className="secondary" onClick={onRunNow}>
            <Play size={14} /> Executar agendado agora
          </button>
          <button className="primary" disabled={saving} onClick={handleSave}>
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar agendamento'}
          </button>
        </div>
      </div>

      <div className="schedule-grid">
        <label className="toggle-card">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          />
          <div>
            <b>Ativar agendamento automático</b>
            <small>
              {schedule?.next_run_at
                ? `Próxima execução: ${new Date(schedule.next_run_at).toLocaleString('pt-BR')}`
                : 'Desativado no momento'}
            </small>
          </div>
        </label>

        <div className="field-card">
          <label>Periodicidade</label>
          <select
            value={form.interval_minutes}
            onChange={(e) => setForm((f) => ({ ...f, interval_minutes: Number(e.target.value) }))}
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-card">
          <label>Seleção de modelos</label>
          <select
            value={form.model_selection_mode}
            onChange={(e) => setForm((f) => ({ ...f, model_selection_mode: e.target.value }))}
          >
            <option value="auto_coding">Descoberta automática (modelos de código)</option>
            <option value="manual">Lista manual selecionada</option>
          </select>
        </div>

        {form.model_selection_mode === 'auto_coding' ? (
          <div className="field-card">
            <label>Máximo de modelos por rodada</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.max_auto_models}
              onChange={(e) => setForm((f) => ({ ...f, max_auto_models: Number(e.target.value) }))}
            />
          </div>
        ) : (
          <div className="field-card">
            <label>Repetições por tarefa</label>
            <select
              value={form.repeats}
              onChange={(e) => setForm((f) => ({ ...f, repeats: Number(e.target.value) }))}
            >
              <option value={1}>1 repetição</option>
              <option value={2}>2 repetições</option>
              <option value={3}>3 repetições</option>
            </select>
          </div>
        )}
      </div>

      <h3>Categorias incluídas no agendamento</h3>
      <div className="chips">
        {categoriesMeta.map((cat) => (
          <button
            key={cat.id}
            className={form.categories.includes(cat.id) ? 'chip selected' : 'chip'}
            onClick={() => toggleCategory(cat.id)}
          >
            {cat.label} ({cat.task_count})
          </button>
        ))}
      </div>

      {form.model_selection_mode === 'manual' && (
        <>
          <h3>Modelos fixos do agendamento ({form.models.length} selecionados)</h3>
          <div className="model-grid compact-grid">
            {codingModels.slice(0, 40).map((m) => (
              <label className="model" key={m.id}>
                <input
                  type="checkbox"
                  checked={form.models.includes(m.id)}
                  onChange={() => toggleModel(m.id)}
                />
                <span>
                  <b>{m.id}</b>
                  <small>{m.vendor || m.owned_by || 'NVIDIA'}</small>
                </span>
              </label>
            ))}
          </div>
        </>
      )}

      {jobs.length > 0 && (
        <>
          <h3>Jobs recentes</h3>
          <div className="jobs-list">
            {jobs.map((j) => (
              <div className="job-row" key={j.id}>
                <span className={`status-pill status-${j.status}`}>{j.status}</span>
                <b>{j.trigger === 'scheduled' ? 'Automático' : 'Manual'}</b>
                <span>
                  {j.completed_steps}/{j.total_steps} ({j.progress_percent}%)
                </span>
                <span>{j.models.length} modelo(s)</span>
                <small>{j.created_at ? new Date(j.created_at).toLocaleString('pt-BR') : ''}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
