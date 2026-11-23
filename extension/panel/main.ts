import { connectHost, type HostReadyContext, type SessionSnapshot } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

type TabId = 'ranking' | 'run' | 'automation' | 'connection';

interface HealthPayload {
  status: string;
  version: string;
  provider_ready?: boolean;
  active_provider_mode?: string;
  active_provider_label?: string;
  opencode_available?: boolean;
  nvidia_configured: boolean;
  scheduler_enabled: boolean;
  active_jobs: number;
}

interface ModelItem {
  id: string;
  vendor?: string;
  modality?: string;
  is_coding_candidate?: boolean;
  tags?: string[];
}

interface RankingRow {
  rank: number;
  model_id: string;
  composite_score: number;
  quality_score: number;
  success_rate: number;
  execution_pass_rate: number | null;
  avg_latency_ms: number;
  avg_tokens_per_second: number | null;
  runs: number;
  successes: number;
  category_scores: Record<string, number>;
}

interface RecommendationPayload {
  has_data: boolean;
  summary: string;
  primary_coding_model: (RankingRow & { openchamber_model_ref: string; rationale: string }) | null;
  fastest_reliable_model: (RankingRow & { openchamber_model_ref: string }) | null;
  best_by_category: Record<string, { category_label: string; model_id: string; score: number }>;
}

interface JobInfo {
  id: string;
  status: string;
  trigger: string;
  total_steps: number;
  completed_steps: number;
  succeeded_steps: number;
  progress_percent: number;
  current_model: string | null;
  current_category: string | null;
  current_task_id: string | null;
}

interface RunSummary {
  id: number;
  model_id: string;
  category: string;
  task_id: string;
  score: number;
  latency_ms: number | null;
  tests_passed: number | null;
  tests_total: number | null;
  status: string;
  summary?: string | null;
}

interface RunDetail extends RunSummary {
  prompt: string;
  response: string | null;
  error: string | null;
  evaluation?: {
    evaluator_type: string;
    code_extracted?: string | null;
    criteria?: Array<{ name: string; passed: boolean; weight: number; earned: number; detail: string }>;
  } | null;
}

interface SchedulePayload {
  enabled: boolean;
  interval_minutes: number;
  model_selection_mode: 'manual' | 'auto_coding';
  max_auto_models: number;
  models: string[];
  categories: string[];
  repeats: number;
  next_run_at: string | null;
  last_status: string | null;
}

const ALL_CATEGORIES = [
  { id: 'reasoning', label: 'Raciocínio' },
  { id: 'coding', label: 'Python/SQL' },
  { id: 'debugging', label: 'Debug' },
  { id: 'delphi', label: 'Delphi' },
  { id: 'csharp', label: 'C#' },
  { id: 'firebird', label: 'Firebird' },
];

const host = connectHost();

const state = {
  surface: 'panel' as string,
  tab: 'ranking' as TabId,
  sessionModelRaw: null as string | null,
  sessionNvidiaModel: null as string | null,
  backendUrl: 'http://127.0.0.1:8765',
  backendOnline: false,
  health: null as HealthPayload | null,
  notice: 'Conectando ao serviço local do ModelArena...',
  noticeError: false,
  models: [] as ModelItem[],
  codingOnly: true,
  search: '',
  selectedModels: [] as string[],
  selectedCategories: ALL_CATEGORIES.map((c) => c.id),
  repeats: 1,
  rankingCat: '',
  ranking: [] as RankingRow[],
  recommendation: null as RecommendationPayload | null,
  activeJob: null as JobInfo | null,
  history: [] as RunSummary[],
  expandedRunId: null as number | null,
  expandedRunDetail: null as RunDetail | null,
  schedule: null as SchedulePayload | null,
  busy: false,
};

let pollTimer: number | null = null;

function extractNvidiaModelId(sessionModel: string | null | undefined): string | null {
  if (!sessionModel) return null;
  const trimmed = sessionModel.trim();
  const knownPrefixes = ['console-nvidia/', 'nvidia/', 'nvidia-nim/'];
  for (const prefix of knownPrefixes) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  return null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function serviceJson<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await host.serviceRequest({
    method,
    path,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let parsed: unknown = null;
  try {
    parsed = res.body ? JSON.parse(res.body) : null;
  } catch {
    parsed = res.body;
  }
  if (res.status < 200 || res.status >= 300) {
    const detail =
      parsed && typeof parsed === 'object' && 'detail' in parsed
        ? String((parsed as { detail: unknown }).detail)
        : `Erro HTTP ${res.status}`;
    const err = new Error(detail) as Error & { code?: string };
    if (parsed && typeof parsed === 'object' && 'code' in parsed) {
      err.code = String((parsed as { code: unknown }).code);
    }
    throw err;
  }
  return parsed as T;
}

async function refreshAll(): Promise<void> {
  try {
    const cfg = await serviceJson<{ backendUrl: string }>('GET', '/config');
    if (cfg.backendUrl) state.backendUrl = cfg.backendUrl;
  } catch {
    // Use default backendUrl
  }

  try {
    const h = await serviceJson<HealthPayload>('GET', '/arena/health');
    state.health = h;
    state.backendOnline = true;
    state.noticeError = false;
    const isReady = h.provider_ready ?? h.nvidia_configured;
    state.notice = isReady
      ? h.active_provider_mode === 'opencode'
        ? `Pronto via ${h.active_provider_label || 'OpenChamber (console-nvidia)'} — sem precisar de API key!`
        : `Backend conectado (${state.backendUrl}) · ${h.active_provider_label || 'NVIDIA NIM'} pronta.`
      : 'Backend conectado, mas nenhum provedor foi encontrado (verifique o OpenChamber ou configure NVIDIA_API_KEY).';

    const [rk, rec, hist, jobsRes, sched] = await Promise.all([
      serviceJson<{ data: RankingRow[] }>(
        'GET',
        state.rankingCat ? `/arena/ranking?category=${encodeURIComponent(state.rankingCat)}` : '/arena/ranking',
      ),
      serviceJson<RecommendationPayload>('GET', '/arena/recommendation'),
      serviceJson<{ data: RunSummary[] }>('GET', '/arena/history?limit=40'),
      serviceJson<{ data: JobInfo[] }>('GET', '/arena/benchmarks/jobs?limit=5'),
      serviceJson<SchedulePayload>('GET', '/arena/schedule'),
    ]);

    state.ranking = rk.data || [];
    state.recommendation = rec;
    state.history = hist.data || [];
    state.schedule = sched;
    const running = (jobsRes.data || []).find((j) => j.status === 'running' || j.status === 'queued') || null;
    state.activeJob = running;
    syncPolling();

    if (isReady && state.models.length === 0) {
      await loadModels(false);
    }
  } catch (err) {
    state.backendOnline = false;
    state.noticeError = true;
    state.notice = err instanceof Error ? err.message : 'Serviço local do ModelArena indisponível.';
  }
  render();
}

async function loadModels(showToast = true): Promise<void> {
  try {
    const res = await serviceJson<{ data: ModelItem[]; coding_total?: number }>('GET', '/arena/models');
    state.models = res.data || [];
    if (state.sessionNvidiaModel && !state.selectedModels.includes(state.sessionNvidiaModel)) {
      if (state.models.some((m) => m.id === state.sessionNvidiaModel)) {
        state.selectedModels = [state.sessionNvidiaModel, ...state.selectedModels];
      }
    }
    if (showToast) {
      await host.toast({
        kind: 'success',
        message: `${res.coding_total ?? state.models.length} modelos NVIDIA de código carregados.`,
      });
    }
  } catch (err) {
    state.noticeError = true;
    state.notice = err instanceof Error ? err.message : 'Erro ao listar modelos NVIDIA.';
  }
  render();
}

function syncPolling(): void {
  const active = state.activeJob && (state.activeJob.status === 'running' || state.activeJob.status === 'queued');
  if (active && pollTimer === null) {
    pollTimer = window.setInterval(() => {
      void pollActiveJob();
    }, 1800);
  } else if (!active && pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function pollActiveJob(): Promise<void> {
  if (!state.activeJob) {
    syncPolling();
    return;
  }
  try {
    const res = await serviceJson<{ job: JobInfo }>('GET', `/arena/benchmarks/jobs/${state.activeJob.id}`);
    state.activeJob = res.job;
    if (res.job.status !== 'running' && res.job.status !== 'queued') {
      syncPolling();
      await host.toast({
        kind: res.job.status === 'completed' ? 'success' : 'info',
        message: `Model Arena: benchmark ${res.job.status} (${res.job.succeeded_steps}/${res.job.total_steps}).`,
      });
      await refreshAll();
    } else {
      render();
    }
  } catch {
    syncPolling();
  }
}

async function startBenchmark(modelsToRun?: string[]): Promise<void> {
  const models = modelsToRun && modelsToRun.length ? modelsToRun : state.selectedModels;
  if (!models.length || !state.selectedCategories.length) {
    await host.toast({ kind: 'error', message: 'Selecione pelo menos um modelo e uma categoria.' });
    return;
  }
  state.busy = true;
  render();
  try {
    const res = await serviceJson<{ job: JobInfo }>('POST', '/arena/benchmarks/jobs', {
      models,
      categories: state.selectedCategories,
      repeats: state.repeats,
    });
    state.activeJob = res.job;
    state.noticeError = false;
    state.notice = `Benchmark iniciado (${res.job.total_steps} avaliações em background).`;
    syncPolling();
    await host.toast({ kind: 'info', message: `Benchmark iniciado para ${models.length} modelo(s).` });
  } catch (err) {
    state.noticeError = true;
    state.notice = err instanceof Error ? err.message : 'Falha ao iniciar benchmark.';
  } finally {
    state.busy = false;
    render();
  }
}

async function cancelJob(): Promise<void> {
  if (!state.activeJob) return;
  try {
    await serviceJson('POST', `/arena/benchmarks/jobs/${state.activeJob.id}/cancel`);
    await host.toast({ kind: 'info', message: 'Cancelamento solicitado.' });
    await pollActiveJob();
  } catch (err) {
    state.noticeError = true;
    state.notice = err instanceof Error ? err.message : 'Não foi possível cancelar o job.';
    render();
  }
}

async function inspectRun(runId: number): Promise<void> {
  if (state.expandedRunId === runId) {
    state.expandedRunId = null;
    state.expandedRunDetail = null;
    render();
    return;
  }
  try {
    const detail = await serviceJson<RunDetail>('GET', `/arena/runs/${runId}`);
    state.expandedRunId = runId;
    state.expandedRunDetail = detail;
  } catch (err) {
    state.noticeError = true;
    state.notice = err instanceof Error ? err.message : 'Erro ao abrir detalhes da execução.';
  }
  render();
}

async function sendRecommendationToChat(): Promise<void> {
  const winner = state.recommendation?.primary_coding_model;
  if (!winner) return;
  const lines = [
    `Resultado atual do Model Arena (NVIDIA NIM):`,
    `- Modelo principal recomendado: \`${winner.openchamber_model_ref}\` (${winner.composite_score}/100 composta · ${winner.quality_score}/100 qualidade real · ${Math.round(winner.avg_latency_ms)} ms).`,
    `- Motivo: ${winner.rationale}`,
  ];
  await host.compose({ text: lines.join('\n'), mode: 'append' });
  await host.toast({ kind: 'success', message: 'Resumo do ranking enviado para a caixa de chat.' });
}

function renderOfflineCard(): string {
  const startCmd = '.\\scripts\\start-modelarena.ps1';
  return `
    <div class="ma-card">
      <div class="ma-badge">Backend Local Offline</div>
      <strong>Inicie o serviço ModelArena para rodar benchmarks</strong>
      <p class="ma-subtitle">O painel do OpenChamber se conecta via serviço local autenticado a <code class="ma-mono">${escapeHtml(state.backendUrl)}</code>.</p>
      <pre class="ma-code">${startCmd}</pre>
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="copy-cmd">Copiar comando</button>
        <button class="ma-btn" data-action="refresh">Tentar reconectar</button>
        <button class="ma-btn" data-action="goto-connection">Alterar URL</button>
      </div>
    </div>
  `;
}

function renderRankingTab(): string {
  const rec = state.recommendation;
  const winner = rec?.primary_coding_model;
  const hero = winner
    ? `
      <div class="ma-card ma-hero">
        <div class="ma-badge">Modelo Principal Recomendado</div>
        <div class="ma-row">
          <strong class="ma-mono" style="font-size:14px">${escapeHtml(winner.model_id)}</strong>
          <span class="ma-score">${winner.composite_score}<small style="font-size:10px;color:var(--ma-muted)">/100</small></span>
        </div>
        <div class="ma-subtitle" style="color:var(--ma-fg);opacity:.9">${escapeHtml(winner.rationale)}</div>
        <div class="ma-btn-row">
          <button class="ma-btn primary" data-action="copy-ref" data-ref="${escapeHtml(winner.openchamber_model_ref)}">Copiar ref OpenChamber</button>
          <button class="ma-btn" data-action="compose-rec">Enviar ao chat</button>
        </div>
      </div>
    `
    : `
      <div class="ma-card ma-hero">
        <div class="ma-badge">Pronto para Comparar</div>
        <strong>Descubra o melhor modelo NVIDIA para programar</strong>
        <div class="ma-subtitle">Vá na aba <b>Executar</b> e rode o benchmark real de código (Python sandbox, SQLite/Firebird, C# e Delphi).</div>
        <div class="ma-btn-row">
          <button class="ma-btn primary" data-action="goto-run">Selecionar modelos</button>
          ${state.sessionNvidiaModel ? `<button class="ma-btn" data-action="bench-session">Testar modelo desta sessão</button>` : ''}
        </div>
      </div>
    `;

  const catChips = [
    `<button class="ma-chip ${!state.rankingCat ? 'selected' : ''}" data-action="rank-cat" data-cat="">Geral</button>`,
    ...ALL_CATEGORIES.map(
      (c) =>
        `<button class="ma-chip ${state.rankingCat === c.id ? 'selected' : ''}" data-action="rank-cat" data-cat="${c.id}">${c.label}</button>`,
    ),
  ].join('');

  const list = state.ranking.length
    ? state.ranking
        .map((r, i) => {
          const isCurrent = state.sessionNvidiaModel && r.model_id === state.sessionNvidiaModel;
          const catSummary = Object.entries(r.category_scores || {})
            .map(([k, v]) => `${k}:${v}`)
            .join(' · ');
          return `
            <div class="ma-rank-item">
              <div class="ma-place ${i === 0 ? 'gold' : ''}">${r.rank || i + 1}</div>
              <div class="ma-rank-body">
                <div class="ma-row">
                  <strong class="ma-mono">${escapeHtml(r.model_id)}</strong>
                  ${isCurrent ? '<span class="ma-badge">Sessão atual</span>' : ''}
                </div>
                <div class="ma-bar"><i style="width:${Math.min(100, Math.max(0, r.composite_score))}%"></i></div>
                <div class="ma-meta">
                  <span>Qual.: <b>${r.quality_score}</b></span>
                  <span>Testes: <b>${r.execution_pass_rate !== null ? `${r.execution_pass_rate}%` : '—'}</b></span>
                  <span>${Math.round(r.avg_latency_ms)} ms</span>
                  ${r.avg_tokens_per_second ? `<span>${r.avg_tokens_per_second} tok/s</span>` : ''}
                </div>
                ${catSummary ? `<div class="ma-subtitle" style="margin-top:3px">${escapeHtml(catSummary)}</div>` : ''}
              </div>
              <div class="ma-score">${r.composite_score}</div>
            </div>
          `;
        })
        .join('')
    : '<p class="ma-subtitle">Nenhum resultado registrado ainda.</p>';

  return `
    ${hero}
    <div class="ma-card">
      <div class="ma-row">
        <strong>Ranking NVIDIA NIM</strong>
        <button class="ma-btn" data-action="refresh">Atualizar</button>
      </div>
      <div class="ma-chips">${catChips}</div>
      <div>${list}</div>
    </div>
  `;
}

function renderRunTab(): string {
  const q = state.search.trim().toLowerCase();
  const visible = state.models.filter((m) => {
    if (state.codingOnly && m.is_coding_candidate === false) return false;
    if (q && !m.id.toLowerCase().includes(q) && !(m.vendor || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const modelOpts = visible.length
    ? visible
        .slice(0, 50)
        .map((m) => {
          const checked = state.selectedModels.includes(m.id);
          return `
            <label class="ma-model-opt ${checked ? 'selected' : ''}">
              <input type="checkbox" data-action="toggle-model" data-model="${escapeHtml(m.id)}" ${checked ? 'checked' : ''} />
              <div style="min-width:0">
                <div class="ma-mono" style="font-size:11.5px;font-weight:600">${escapeHtml(m.id)}</div>
                <div class="ma-subtitle">${escapeHtml(m.vendor || 'nvidia')}${m.tags?.length ? ` · ${escapeHtml(m.tags.join(', '))}` : ''}</div>
              </div>
            </label>
          `;
        })
        .join('')
    : '<p class="ma-subtitle">Nenhum modelo carregado. Clique em "Atualizar lista" para listar os modelos NVIDIA do seu OpenChamber.</p>';

  const catChips = ALL_CATEGORIES.map(
    (c) =>
      `<button class="ma-chip ${state.selectedCategories.includes(c.id) ? 'selected' : ''}" data-action="toggle-cat" data-cat="${c.id}">${c.label}</button>`,
  ).join('');

  return `
    <div class="ma-card">
      <div class="ma-row">
        <strong>Selecionar Modelos (${state.selectedModels.length})</strong>
        <div class="ma-btn-row">
          <button class="ma-btn" data-action="load-models">Atualizar lista</button>
          <button class="ma-btn" data-action="select-top">Top 4</button>
        </div>
      </div>
      <input class="ma-input" id="ma-search" placeholder="Filtrar modelos (ex: glm, nemotron, qwen, deepseek)..." value="${escapeHtml(state.search)}" />
      <label class="ma-subtitle" style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" id="ma-coding-only" ${state.codingOnly ? 'checked' : ''} />
        Mostrar apenas modelos de chat/programação
      </label>
      <div class="ma-model-list">${modelOpts}</div>
      <div class="ma-row" style="margin-top:4px">
        <strong style="font-size:12px">Categorias de avaliação real</strong>
        <select class="ma-select" id="ma-repeats" style="width:auto">
          <option value="1" ${state.repeats === 1 ? 'selected' : ''}>1x</option>
          <option value="2" ${state.repeats === 2 ? 'selected' : ''}>2x</option>
          <option value="3" ${state.repeats === 3 ? 'selected' : ''}>3x</option>
        </select>
      </div>
      <div class="ma-chips">${catChips}</div>
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="start-bench" ${state.busy || Boolean(state.activeJob && state.activeJob.status === 'running') ? 'disabled' : ''}>
          Iniciar Benchmark (${state.selectedModels.length} modelo${state.selectedModels.length === 1 ? '' : 's'})
        </button>
      </div>
    </div>
  `;
}

function renderAutomationTab(): string {
  const sched = state.schedule;
  const histHtml = state.history.length
    ? state.history
        .slice(0, 20)
        .map((r) => {
          const expanded = state.expandedRunId === r.id && state.expandedRunDetail;
          const detailHtml = expanded
            ? `
              <div style="margin-top:6px;display:flex;flex-direction:column;gap:5px">
                ${(expanded.evaluation?.criteria || [])
                  .map(
                    (c) => `
                      <div class="ma-crit ${c.passed ? 'pass' : 'fail'}">
                        <span><b>${c.passed ? '✓' : '✗'} ${escapeHtml(c.name)}</b> — ${escapeHtml(c.detail)}</span>
                        <span>${c.earned}/${c.weight}</span>
                      </div>
                    `,
                  )
                  .join('')}
                ${expanded.evaluation?.code_extracted ? `<pre class="ma-code">${escapeHtml(expanded.evaluation.code_extracted)}</pre>` : ''}
                ${expanded.error ? `<div class="ma-notice error">${escapeHtml(expanded.error)}</div>` : ''}
              </div>
            `
            : '';

          return `
            <div class="ma-run-row" data-action="inspect-run" data-run-id="${r.id}">
              <div class="ma-row">
                <strong class="ma-mono" style="font-size:11px">${escapeHtml(r.model_id)}</strong>
                <span class="ma-score" style="font-size:12px">${r.score}/100</span>
              </div>
              <div class="ma-meta">
                <span>${escapeHtml(r.category)} / ${escapeHtml(r.task_id)}</span>
                <span>${r.tests_total ? `${r.tests_passed}/${r.tests_total} testes` : r.status}</span>
                <span>${Math.round(r.latency_ms || 0)} ms</span>
              </div>
              ${detailHtml}
            </div>
          `;
        })
        .join('')
    : '<p class="ma-subtitle">Nenhuma avaliação registrada ainda.</p>';

  return `
    <div class="ma-card">
      <div class="ma-row">
        <strong>Execução Automática</strong>
        <span class="ma-badge">${sched?.enabled ? 'Ativo' : 'Pausado'}</span>
      </div>
      <label class="ma-subtitle" style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" id="ma-sched-enabled" ${sched?.enabled ? 'checked' : ''} />
        Rodar benchmarks automaticamente e manter ranking atualizado
      </label>
      <div class="ma-row">
        <select class="ma-select" id="ma-sched-interval" style="flex:1">
          <option value="60" ${sched?.interval_minutes === 60 ? 'selected' : ''}>A cada 1 hora</option>
          <option value="180" ${sched?.interval_minutes === 180 ? 'selected' : ''}>A cada 3 horas</option>
          <option value="360" ${!sched || sched.interval_minutes === 360 ? 'selected' : ''}>A cada 6 horas</option>
          <option value="720" ${sched?.interval_minutes === 720 ? 'selected' : ''}>A cada 12 horas</option>
          <option value="1440" ${sched?.interval_minutes === 1440 ? 'selected' : ''}>Diariamente (24h)</option>
        </select>
        <select class="ma-select" id="ma-sched-mode" style="flex:1">
          <option value="auto_coding" ${!sched || sched.model_selection_mode === 'auto_coding' ? 'selected' : ''}>Auto (Top modelos código)</option>
          <option value="manual" ${sched?.model_selection_mode === 'manual' ? 'selected' : ''}>Modelos selecionados</option>
        </select>
      </div>
      ${sched?.next_run_at ? `<div class="ma-subtitle">Próxima rodada: ${new Date(sched.next_run_at).toLocaleString('pt-BR')}</div>` : ''}
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="save-schedule">Salvar agendamento</button>
        <button class="ma-btn" data-action="run-schedule-now">Executar agora</button>
      </div>
    </div>
    <div class="ma-card">
      <strong>Histórico e Rubrica (clique para inspecionar)</strong>
      ${histHtml}
    </div>
  `;
}

function renderConnectionTab(): string {
  return `
    <div class="ma-card">
      <strong>Conexão com Backend ModelArena</strong>
      <div class="ma-subtitle">Modo ativo: <b>${escapeHtml(state.health?.active_provider_label || 'Aguardando conexão')}</b>. Funciona direto com o provedor <code>console-nvidia</code> do seu OpenChamber sem precisar de API key.</div>
      <input class="ma-input ma-mono" id="ma-backend-url" value="${escapeHtml(state.backendUrl)}" />
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="save-backend-url">Salvar URL e reconectar</button>
        <button class="ma-btn" data-action="open-web">Abrir Dashboard Web</button>
      </div>
    </div>
  `;
}

function render(): void {
  const root = document.getElementById('root');
  if (!root) return;

  const jobBanner =
    state.activeJob && (state.activeJob.status === 'running' || state.activeJob.status === 'queued')
      ? `
        <div class="ma-card">
          <div class="ma-row">
            <strong>Benchmark em andamento (${state.activeJob.completed_steps}/${state.activeJob.total_steps} · ${state.activeJob.progress_percent}%)</strong>
            <button class="ma-btn danger" data-action="cancel-job">Cancelar</button>
          </div>
          <div class="ma-subtitle ma-mono">${escapeHtml(state.activeJob.current_model || 'Preparando...')} ${state.activeJob.current_task_id ? `→ ${escapeHtml(state.activeJob.current_task_id)}` : ''}</div>
          <div class="ma-bar"><i style="width:${state.activeJob.progress_percent}%"></i></div>
        </div>
      `
      : '';

  const sessionBar = state.sessionModelRaw
    ? `
      <div class="ma-session-pill">
        <span>Sessão OpenChamber:</span>
        <strong class="ma-mono">${escapeHtml(state.sessionModelRaw)}</strong>
      </div>
    `
    : '';

  let body = '';
  if (!state.backendOnline && state.tab !== 'connection') {
    body = renderOfflineCard();
  } else if (state.tab === 'ranking') {
    body = renderRankingTab();
  } else if (state.tab === 'run') {
    body = renderRunTab();
  } else if (state.tab === 'automation') {
    body = renderAutomationTab();
  } else {
    body = renderConnectionTab();
  }

  const isReady = state.health?.provider_ready ?? state.health?.nvidia_configured;
  const dotClass = !state.backendOnline
    ? 'ma-dot offline'
    : isReady
      ? 'ma-dot'
      : 'ma-dot warn';
  const statusLabel = !state.backendOnline
    ? 'Offline'
    : isReady
      ? state.health?.active_provider_label || 'NVIDIA'
      : 'Não config.';

  root.innerHTML = `
    <div class="ma-shell ${state.surface === 'page' ? 'ma-page' : ''}">
      <header class="ma-header">
        <div class="ma-brand">
          <div class="ma-logo">MA</div>
          <div>
            <h1 class="ma-title">Model Arena</h1>
            <p class="ma-subtitle">NVIDIA NIM Benchmark</p>
          </div>
        </div>
        <div class="ma-status"><span class="${dotClass}"></span><span>${statusLabel}</span></div>
      </header>
      ${sessionBar}
      <nav class="ma-tabs">
        <button class="ma-tab ${state.tab === 'ranking' ? 'active' : ''}" data-action="tab" data-tab="ranking">Ranking</button>
        <button class="ma-tab ${state.tab === 'run' ? 'active' : ''}" data-action="tab" data-tab="run">Executar</button>
        <button class="ma-tab ${state.tab === 'automation' ? 'active' : ''}" data-action="tab" data-tab="automation">Automático</button>
        <button class="ma-tab ${state.tab === 'connection' ? 'active' : ''}" data-action="tab" data-tab="connection">Conexão</button>
      </nav>
      <div class="ma-notice ${state.noticeError ? 'error' : ''}">${escapeHtml(state.notice)}</div>
      ${jobBanner}
      ${body}
    </div>
  `;

  bindEvents(root);
}

function bindEvents(root: HTMLElement): void {
  const searchInput = root.querySelector<HTMLInputElement>('#ma-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.search = searchInput.value;
      render();
      const refocused = document.querySelector<HTMLInputElement>('#ma-search');
      if (refocused) {
        refocused.focus();
        refocused.setSelectionRange(state.search.length, state.search.length);
      }
    });
  }

  root.querySelector<HTMLInputElement>('#ma-coding-only')?.addEventListener('change', (e) => {
    state.codingOnly = (e.target as HTMLInputElement).checked;
    render();
  });

  root.querySelector<HTMLSelectElement>('#ma-repeats')?.addEventListener('change', (e) => {
    state.repeats = Number((e.target as HTMLSelectElement).value);
  });

  root.querySelectorAll<HTMLInputElement>('input[data-action="toggle-model"]').forEach((el) => {
    el.addEventListener('change', () => {
      const id = el.dataset.model;
      if (!id) return;
      state.selectedModels = el.checked
        ? [...new Set([...state.selectedModels, id])]
        : state.selectedModels.filter((m) => m !== id);
      render();
    });
  });

  root.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    if (el.tagName === 'INPUT') return;
    el.addEventListener('click', () => {
      const action = el.dataset.action;
      if (action === 'tab') {
        state.tab = (el.dataset.tab as TabId) || 'ranking';
        render();
      } else if (action === 'goto-run') {
        state.tab = 'run';
        render();
      } else if (action === 'goto-connection') {
        state.tab = 'connection';
        render();
      } else if (action === 'refresh') {
        void refreshAll();
      } else if (action === 'load-models') {
        void loadModels(true);
      } else if (action === 'select-top') {
        const coding = state.models.filter((m) => m.is_coding_candidate !== false).slice(0, 4).map((m) => m.id);
        const withSession = state.sessionNvidiaModel ? [state.sessionNvidiaModel, ...coding] : coding;
        state.selectedModels = [...new Set(withSession)].slice(0, 5);
        render();
      } else if (action === 'rank-cat') {
        state.rankingCat = el.dataset.cat || '';
        void refreshAll();
      } else if (action === 'toggle-cat') {
        const cat = el.dataset.cat;
        if (!cat) return;
        state.selectedCategories = state.selectedCategories.includes(cat)
          ? state.selectedCategories.filter((c) => c !== cat)
          : [...state.selectedCategories, cat];
        render();
      } else if (action === 'start-bench') {
        void startBenchmark();
      } else if (action === 'bench-session' && state.sessionNvidiaModel) {
        void startBenchmark([state.sessionNvidiaModel]);
      } else if (action === 'cancel-job') {
        void cancelJob();
      } else if (action === 'copy-ref') {
        const ref = el.dataset.ref || '';
        void host.writeClipboard(ref).then(() => host.toast({ kind: 'success', message: `Copiado: ${ref}` }));
      } else if (action === 'copy-cmd') {
        void host
          .writeClipboard('.\\scripts\\start-modelarena.ps1')
          .then(() => host.toast({ kind: 'success', message: 'Comando copiado para a área de transferência.' }));
      } else if (action === 'compose-rec') {
        void sendRecommendationToChat();
      } else if (action === 'open-web') {
        void host.openUrl(state.backendUrl);
      } else if (action === 'inspect-run') {
        const id = Number(el.dataset.runId);
        if (Number.isFinite(id)) void inspectRun(id);
      } else if (action === 'save-schedule') {
        const enabled = Boolean(root.querySelector<HTMLInputElement>('#ma-sched-enabled')?.checked);
        const interval_minutes = Number(root.querySelector<HTMLSelectElement>('#ma-sched-interval')?.value || 360);
        const model_selection_mode =
          (root.querySelector<HTMLSelectElement>('#ma-sched-mode')?.value as 'manual' | 'auto_coding') || 'auto_coding';
        void serviceJson<SchedulePayload>('PUT', '/arena/schedule', {
          enabled,
          interval_minutes,
          model_selection_mode,
          max_auto_models: 5,
          models: state.selectedModels,
          categories: state.selectedCategories,
          repeats: state.repeats,
        })
          .then((saved) => {
            state.schedule = saved;
            return host.toast({ kind: 'success', message: saved.enabled ? 'Agendamento ativado!' : 'Agendamento salvo.' });
          })
          .then(() => render())
          .catch((err) => {
            state.noticeError = true;
            state.notice = err instanceof Error ? err.message : 'Erro ao salvar agendamento.';
            render();
          });
      } else if (action === 'run-schedule-now') {
        void serviceJson<{ job?: JobInfo }>('POST', '/arena/schedule/run-now')
          .then((res) => {
            if (res.job) {
              state.activeJob = res.job;
              syncPolling();
            }
            return host.toast({ kind: 'info', message: 'Execução agendada iniciada agora.' });
          })
          .then(() => render())
          .catch((err) => {
            state.noticeError = true;
            state.notice = err instanceof Error ? err.message : 'Erro ao executar agendamento.';
            render();
          });
      } else if (action === 'save-backend-url') {
        const rawUrl = root.querySelector<HTMLInputElement>('#ma-backend-url')?.value || '';
        void serviceJson<{ backendUrl: string }>('PUT', '/config', { backendUrl: rawUrl })
          .then((cfg) => {
            state.backendUrl = cfg.backendUrl;
            return host.toast({ kind: 'success', message: `Backend atualizado: ${cfg.backendUrl}` });
          })
          .then(() => refreshAll())
          .catch((err) => {
            state.noticeError = true;
            state.notice = err instanceof Error ? err.message : 'URL inválida.';
            render();
          });
      }
    });
  });
}

function applySession(session: SessionSnapshot | null): void {
  state.sessionModelRaw = session?.model || null;
  state.sessionNvidiaModel = extractNvidiaModelId(session?.model);
  render();
}

host.onReady((ready: HostReadyContext) => {
  applyHostReady(ready, document.documentElement);
  state.surface = ready.surface;
  applySession(ready.session);
  void refreshAll();
});

host.onSession((session) => {
  applySession(session);
});

render();
