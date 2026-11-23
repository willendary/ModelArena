import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, Cpu, Gauge, RefreshCw, Play, Trophy, Clock3, CheckCircle2, AlertCircle } from 'lucide-react'
import './style.css'

function App() {
  const [models, setModels] = useState([])
  const [selected, setSelected] = useState([])
  const [categories, setCategories] = useState(['reasoning','coding','debugging','delphi','csharp','firebird'])
  const [ranking, setRanking] = useState([])
  const [history, setHistory] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Configure NVIDIA_API_KEY no backend para começar.')
  const [repeats, setRepeats] = useState(1)
  const [tab, setTab] = useState('overview')

  async function loadModels() {
    try {
      const r = await fetch('/api/models'); const j = await r.json()
      if (!r.ok) throw new Error(j.detail || 'Falha ao carregar modelos')
      setModels(j.data || []); setMessage(`${j.data?.length || 0} modelos encontrados na API NVIDIA.`)
    } catch(e) { setMessage(e.message) }
  }
  async function refresh() {
    const [r,h] = await Promise.all([fetch('/api/ranking'),fetch('/api/history')])
    const jr=await r.json(), jh=await h.json(); setRanking(jr.data||[]); setHistory(jh.data||[])
  }
  useEffect(()=>{ loadModels(); refresh() }, [])
  const stats = useMemo(()=>({count:models.length, best:ranking[0], runs:history.length, avg:ranking.length ? Math.round(ranking.reduce((a,x)=>a+x.avg_latency_ms,0)/ranking.length) : 0}),[models,ranking,history])
  function toggleModel(id) { setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]) }
  function toggleCategory(id) { setCategories(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]) }
  async function run() {
    if (!selected.length || !categories.length) { setMessage('Selecione pelo menos um modelo e uma categoria.'); return }
    setBusy(true); setMessage('Executando benchmark. Aguarde a conclusão...')
    try {
      const r=await fetch('/api/benchmarks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({models:selected,categories,repeats})})
      const j=await r.json(); if(!r.ok) throw new Error(j.detail||'Falha no benchmark')
      setMessage(`Benchmark concluído: ${j.created} execuções registradas.`); await refresh()
    } catch(e) { setMessage(e.message) } finally { setBusy(false) }
  }
  return <main>
    <header><div className="brand"><div className="logo"><Cpu/></div><div><h1>ModelArena</h1><p>AI model benchmark laboratory</p></div></div><div className="provider"><span className="dot"/> NVIDIA NIM <button className="icon" onClick={loadModels} title="Atualizar modelos"><RefreshCw size={17}/></button></div></header>
    <nav>{[['overview','Visão geral'],['models','Modelos'],['history','Histórico']].map(([id,label])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}>{label}</button>)}</nav>
    <div className="notice">{message}</div>
    {tab==='overview' && <>
      <section className="stats">
        <Stat icon={<Cpu/>} label="Modelos descobertos" value={stats.count}/>
        <Stat icon={<Trophy/>} label="Melhor pontuação" value={stats.best?`${stats.best.score}/100`:'—'}/>
        <Stat icon={<Activity/>} label="Execuções registradas" value={stats.runs}/>
        <Stat icon={<Gauge/>} label="Latência média" value={stats.avg?`${stats.avg} ms`:'—'}/>
      </section>
      <section className="panel"><div className="panel-title"><div><h2>Executar benchmark</h2><p>Mesmos testes para todos os modelos selecionados.</p></div><button className="primary" disabled={busy} onClick={run}><Play size={16}/>{busy?'Executando...':'Iniciar benchmark'}</button></div>
        <h3>Modelos NVIDIA</h3><div className="model-grid">{models.map(m=><label className="model" key={m.id}><input type="checkbox" checked={selected.includes(m.id)} onChange={()=>toggleModel(m.id)}/><span><b>{m.id}</b><small>{m.owned_by||'NVIDIA'}</small></span></label>)}</div>
        <div className="rowline"><h3>Categorias de teste</h3><label className="repeat">Repetições <select value={repeats} onChange={e=>setRepeats(Number(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label></div>
        <div className="chips">{[['reasoning','Raciocínio'],['coding','Programação'],['debugging','Debugging'],['delphi','Delphi'],['csharp','C#/.NET'],['firebird','Firebird SQL']].map(([id,label])=><button key={id} className={categories.includes(id)?'chip selected':'chip'} onClick={()=>toggleCategory(id)}>{label}</button>)}</div>
      </section>
      <section className="panel"><div className="panel-title"><div><h2>Ranking geral</h2><p>Ordenado pela média das notas determinísticas do benchmark.</p></div><button className="secondary" onClick={refresh}><RefreshCw size={15}/> Atualizar</button></div><Ranking rows={ranking}/></section>
    </>}
    {tab==='models' && <section className="panel"><h2>Modelos descobertos</h2><p>Lista dinâmica retornada pela API configurada.</p><div className="model-grid">{models.map(m=><div className="model" key={m.id}><Cpu size={17}/><span><b>{m.id}</b><small>{m.owned_by||'NVIDIA'}</small></span></div>)}</div></section>}
    {tab==='history' && <section className="panel"><h2>Histórico recente</h2>{history.map(x=><div className="history" key={x.id}><span>{x.status==='success'?<CheckCircle2 color="#22c55e"/>:<AlertCircle color="#ef4444"/>}</span><b>{x.model_id}</b><span>{x.category}</span><span>{x.score}/100</span><span><Clock3 size={14}/> {Math.round(x.latency_ms||0)} ms</span></div>)}</section>}
    <footer>ModelArena MVP · Resultados medidos nesta instalação · Não execute código gerado automaticamente.</footer>
  </main>
}
function Stat({icon,label,value}) { return <div className="stat"><div className="stat-icon">{icon}</div><div><small>{label}</small><strong>{value}</strong></div></div> }
function Ranking({rows}) { if(!rows.length) return <p className="empty">Ainda não há resultados. Execute um benchmark para gerar o ranking.</p>; return <div>{rows.map((r,i)=><div className="rank" key={r.model_id}><div className="place">{i+1}</div><div className="rank-main"><b>{r.model_id}</b><div className="bar"><i style={{width:`${r.score}%`}}/></div><small>{r.runs} execuções · {r.successes} sucessos · {r.avg_latency_ms} ms</small></div><strong className="score">{r.score}<small>/100</small></strong></div>)}</div> }
createRoot(document.getElementById('root')).render(<App/>)
