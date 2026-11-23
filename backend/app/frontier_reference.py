from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from .ranking import build_ranking

REFERENCE_UPDATED_AT = "2026-11"
FRONTIER_LEADER_SCORE = 97.0
FRONTIER_LEADER_NAME = "Claude Opus 5"

FRONTIER_BASELINES: list[dict[str, Any]] = [
    {
        "id": "anthropic/claude-opus-5",
        "name": "Claude Opus 5",
        "family": "Claude (Anthropic)",
        "tier": "fronteira",
        "swe_bench_verified": 97.0,
        "swe_bench_estimated": False,
        "context_window": "1M",
        "source": "Vals AI / SWE-bench Verified (mini-SWE-agent)",
        "notes": "Referência absoluta em engenharia multi-arquivo, refatoração estrutural e correção autônoma de bugs.",
    },
    {
        "id": "deepseek/deepseek-v4-pro",
        "name": "DeepSeek-V4 Pro",
        "family": "DeepSeek",
        "tier": "fronteira",
        "swe_bench_verified": 96.4,
        "swe_bench_estimated": False,
        "context_window": "256K+",
        "source": "Vals AI / LLM Leaderboard (SWE-bench Verified)",
        "notes": "Topo entre modelos abertos/custo-benefício em engenharia de software e raciocínio.",
    },
    {
        "id": "openai/gpt-5.6-sol",
        "name": "GPT-5.6 Sol (ChatGPT)",
        "family": "ChatGPT (OpenAI)",
        "tier": "fronteira",
        "swe_bench_verified": 96.2,
        "swe_bench_estimated": False,
        "context_window": "400K+",
        "source": "Vals AI (SWE-bench Verified)",
        "notes": "Excelente em lógica rigorosa, algoritmos complexos e aderência estrita a especificações.",
    },
    {
        "id": "anthropic/claude-fable-5",
        "name": "Claude Fable 5",
        "family": "Claude (Anthropic)",
        "tier": "fronteira",
        "swe_bench_verified": 95.0,
        "swe_bench_estimated": False,
        "context_window": "1M",
        "source": "Vals AI (SWE-bench Verified)",
        "notes": "Equilíbrio entre velocidade e altíssima estabilidade em edições multi-arquivo.",
    },
    {
        "id": "google/gemini-3.1-pro",
        "name": "Gemini 3.1 Pro",
        "family": "Gemini (Google)",
        "tier": "fronteira",
        "swe_bench_verified": 80.6,
        "swe_bench_estimated": False,
        "context_window": "1M–2M",
        "source": "LLM Registry (harness padronizado SWE-bench Verified)",
        "notes": "Contexto nativo massivo para ler repositórios inteiros; forte em análise de arquitetura.",
    },
    {
        "id": "google/gemini-3-flash",
        "name": "Gemini 3 Flash",
        "family": "Gemini (Google)",
        "tier": "rapido-fronteira",
        "swe_bench_verified": 75.8,
        "swe_bench_estimated": False,
        "context_window": "1M",
        "source": "LLM Leaderboard (SWE-bench Verified)",
        "notes": "Referência de modelo rápido/econômico de grande laboratório para tarefas cotidianas.",
    },
]

NVIDIA_REFERENCE_PROFILES: dict[str, dict[str, Any]] = {
    "z-ai/glm-5.3-flash": {
        "display_name": "GLM-5.3-Flash (Z.ai)",
        "params": "320B MoE (~18B ativos)",
        "context_window": "1M",
        "swe_bench_verified": 92.0,
        "swe_bench_estimated": False,
        "alt_metric_label": "SWE-bench Verified (mini-SWE-agent)",
        "alt_metric_score": 92.0,
        "source": "Vals AI / Z.ai (2026)",
        "project_risk": "baixo",
        "risk_label": "Baixo risco (Mais próximo da fronteira)",
        "guidance": "Único do catálogo NVIDIA atual acima de 90% no SWE-bench Verified (~5 pts abaixo do topo). Melhor candidato para atuar como agente principal em projetos reais, ainda revisando diffs críticos.",
    },
    "nvidia/nemotron-3.5-super-vl-120b-a12b": {
        "display_name": "Nemotron-3.5-Super-VL 120B",
        "params": "120B MoE (12B ativos)",
        "context_window": "256K+",
        "swe_bench_verified": 71.1,
        "swe_bench_estimated": False,
        "alt_metric_label": "SWE-bench Pro / LiveCodeBench v6",
        "alt_metric_score": 51.8,
        "source": "NVIDIA Technical Report / arXiv (2026)",
        "project_risk": "medio",
        "risk_label": "Risco médio (~26 pts abaixo do topo)",
        "guidance": "Muito competente em tarefas bem delimitadas e análise técnica, mas ~26 pontos abaixo de Claude/GPT/DeepSeek de ponta em edição autônoma de repositórios. Use com revisão humana em mudanças multi-arquivo.",
    },
    "nvidia/nemotron-3-ultra-550b-a55b": {
        "display_name": "Nemotron-3-Ultra 550B",
        "params": "550B MoE (55B ativos)",
        "context_window": "256K+",
        "swe_bench_verified": 69.0,
        "swe_bench_estimated": False,
        "alt_metric_label": "SWE-bench Verified",
        "alt_metric_score": 69.0,
        "source": "NVIDIA / OpenRouter (2026)",
        "project_risk": "medio",
        "risk_label": "Risco médio (~28 pts abaixo do topo)",
        "guidance": "Excelente em funções isoladas, SQL e explicações técnicas (tira 100/100 facilmente em tarefas unitárias), porém fica ~28 pontos atrás da fronteira em mudanças complexas multi-arquivo. Bom copiloto, mas peça planos pequenos antes de editar o projeto.",
    },
    "minimaxai/minimax-m3.1-flash": {
        "display_name": "MiniMax M3.1 Flash",
        "params": "428B MoE (~23B ativos)",
        "context_window": "1M",
        "swe_bench_verified": None,
        "swe_bench_estimated": False,
        "alt_metric_label": "DeepSWE v1.1 (23% SWE Refactor)",
        "alt_metric_score": 73.7,
        "source": "MiniMax / HuggingFace (2026)",
        "project_risk": "medio",
        "risk_label": "Risco médio (Rápido, fraco em refatoração)",
        "guidance": "Muito veloz (~180 tok/s) e bom em loops guiados (73,7% DeepSWE), mas pontua baixo em refatoração estrutural (23% SWE Refactor). Evite pedir reescritas grandes sem testes.",
    },
    "google/gemma-4-31b-it": {
        "display_name": "Gemma 4 31B IT",
        "params": "30.7B denso",
        "context_window": "256K",
        "swe_bench_verified": 63.0,
        "swe_bench_estimated": True,
        "alt_metric_label": "LiveCodeBench v6",
        "alt_metric_score": 80.0,
        "source": "Google DeepMind / avaliações comunitárias (2026)",
        "project_risk": "medio-alto",
        "risk_label": "Risco médio-alto (~34 pts abaixo do topo)",
        "guidance": "Muito forte em algoritmos e scripts isolados (80% LiveCodeBench), porém menos confiável em uso contínuo de ferramentas/patches multi-arquivo no agente.",
    },
    "nvidia/nemotron-3.5-lightning-30b-a3b": {
        "display_name": "Nemotron-3.5-Lightning 30B",
        "params": "30B MoE (apenas 3B ativos)",
        "context_window": "256K",
        "swe_bench_verified": 51.6,
        "swe_bench_estimated": False,
        "alt_metric_label": "SWE-bench Verified (BF16)",
        "alt_metric_score": 51.6,
        "source": "NVIDIA / Layer3Labs (2026)",
        "project_risk": "alto",
        "risk_label": "Risco alto (~45 pts abaixo do topo)",
        "guidance": "Apenas 3B parâmetros ativos: excelente para sub-tarefas rápidas, autocomplete e buscas, mas tem alto risco de quebrar invariantes ou errar lógica se editar o projeto sozinho.",
    },
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": {
        "display_name": "Nemotron-3-Nano-Omni 30B",
        "params": "30B MoE (~3B ativos, multimodal)",
        "context_window": "128K+",
        "swe_bench_verified": None,
        "swe_bench_estimated": False,
        "alt_metric_label": "Classe 3B ativos (compacto/omni)",
        "alt_metric_score": None,
        "source": "NVIDIA (perfil de porte)",
        "project_risk": "alto",
        "risk_label": "Risco alto (Modelo compacto 3B ativos)",
        "guidance": "Projetado para multimodalidade leve e baixo custo, não para liderar engenharia de software em projetos reais.",
    },
    "meta/muse-glimmer-30b": {
        "display_name": "Muse Glimmer 30B (Meta)",
        "params": "30B (local/agente leve)",
        "context_window": "128K+",
        "swe_bench_verified": None,
        "swe_bench_estimated": False,
        "alt_metric_label": "Classe 30B local",
        "alt_metric_score": None,
        "source": "Meta (perfil de porte)",
        "project_risk": "alto",
        "risk_label": "Risco alto (Agente local 30B)",
        "guidance": "Bom para automações locais simples, mas distante dos modelos de ponta em código de produção.",
    },
    "meta/llama-3.2-90b-vision-instruct": {
        "display_name": "Llama 3.2 90B Vision",
        "params": "90B (foco em visão, geração anterior)",
        "context_window": "128K",
        "swe_bench_verified": None,
        "swe_bench_estimated": False,
        "alt_metric_label": "Foco multimodal/visão (geração 3.2)",
        "alt_metric_score": None,
        "source": "Meta (2024/2025)",
        "project_risk": "alto",
        "risk_label": "Risco alto (Modelo de visão / legado)",
        "guidance": "Baseado na geração Llama 3.1/3.2 voltada a leitura de imagens/documentos; desatualizado como agente de código frente a 2026.",
    },
    "meta/llama-3.2-11b-vision-instruct": {
        "display_name": "Llama 3.2 11B Vision",
        "params": "11B (foco em visão)",
        "context_window": "128K",
        "swe_bench_verified": 25.0,
        "swe_bench_estimated": True,
        "alt_metric_label": "Faixa estimada 11B visão (20–30%)",
        "alt_metric_score": 25.0,
        "source": "Meta / faixa de referência 11B",
        "project_risk": "muito-alto",
        "risk_label": "Risco muito alto (~72 pts abaixo do topo)",
        "guidance": "Modelo pequeno focado em visão. Muito propenso a alucinar funções, corromper edições e quebrar projetos reais — não use para editar código.",
    },
    "openai/gpt-oss-20b": {
        "display_name": "GPT-OSS 20B",
        "params": "20B",
        "context_window": "128K",
        "swe_bench_verified": None,
        "swe_bench_estimated": False,
        "alt_metric_label": "Descontinuado (410 Gone)",
        "alt_metric_score": None,
        "source": "NVIDIA Console (EOL 2026-11-18)",
        "project_risk": "indisponivel",
        "risk_label": "Indisponível (Descontinuado)",
        "guidance": "Modelo atingiu fim de vida no provedor NVIDIA Console (retorna HTTP 410).",
    },
}

RISK_ORDER = {
    "baixo": 0,
    "medio": 1,
    "medio-alto": 2,
    "alto": 3,
    "muito-alto": 4,
    "indisponivel": 5,
    "desconhecido": 6,
}


def get_nvidia_reference_profile(model_id: str) -> dict[str, Any]:
    clean = (model_id or "").strip()
    if clean.lower().startswith("console-nvidia/"):
        clean = clean[len("console-nvidia/"):]

    if clean in NVIDIA_REFERENCE_PROFILES:
        return NVIDIA_REFERENCE_PROFILES[clean]

    lower = clean.lower()
    for key, profile in NVIDIA_REFERENCE_PROFILES.items():
        if key.lower() in lower or lower in key.lower():
            return profile

    return {
        "display_name": clean,
        "params": "Não catalogado",
        "context_window": "—",
        "swe_bench_verified": None,
        "swe_bench_estimated": False,
        "alt_metric_label": "Sem benchmark público catalogado",
        "alt_metric_score": None,
        "source": "Sem referência externa registrada",
        "project_risk": "desconhecido",
        "risk_label": "Sem referência externa",
        "guidance": "Use a nota local do ModelArena e valide com git diff + testes antes de confiar em edições grandes.",
    }


def build_frontier_comparison(db: Session) -> dict[str, Any]:
    """Combine public frontier coding baselines (Claude/GPT/DeepSeek/Gemini) with NVIDIA reference profiles and local ModelArena results."""
    local_ranking = build_ranking(db)
    local_by_id = {row["model_id"]: row for row in local_ranking["data"]}

    # Union of all known NVIDIA Console profiles + any additional locally benchmarked models
    all_model_ids = list(NVIDIA_REFERENCE_PROFILES.keys())
    for mid in local_by_id:
        if mid not in all_model_ids:
            all_model_ids.append(mid)

    nvidia_rows: list[dict[str, Any]] = []
    for mid in all_model_ids:
        profile = get_nvidia_reference_profile(mid)
        local = local_by_id.get(mid)
        swe = profile.get("swe_bench_verified")
        gap_pp = round(swe - FRONTIER_LEADER_SCORE, 1) if isinstance(swe, (int, float)) else None
        rel_pct = round((swe / FRONTIER_LEADER_SCORE) * 100.0, 1) if isinstance(swe, (int, float)) else None

        nvidia_rows.append(
            {
                "model_id": mid,
                "display_name": profile["display_name"],
                "params": profile["params"],
                "context_window": profile["context_window"],
                "swe_bench_verified": swe,
                "swe_bench_estimated": bool(profile.get("swe_bench_estimated")),
                "alt_metric_label": profile.get("alt_metric_label"),
                "alt_metric_score": profile.get("alt_metric_score"),
                "gap_vs_frontier_pp": gap_pp,
                "relative_to_frontier_pct": rel_pct,
                "project_risk": profile["project_risk"],
                "risk_label": profile["risk_label"],
                "guidance": profile["guidance"],
                "source": profile["source"],
                "tested_locally": local is not None,
                "local_composite_score": local["composite_score"] if local else None,
                "local_quality_score": local["quality_score"] if local else None,
                "local_execution_pass_rate": local["execution_pass_rate"] if local else None,
                "local_avg_latency_ms": local["avg_latency_ms"] if local else None,
                "local_runs": local["runs"] if local else 0,
            }
        )

    nvidia_rows.sort(
        key=lambda r: (
            RISK_ORDER.get(r["project_risk"], 9),
            -(r["swe_bench_verified"] if r["swe_bench_verified"] is not None else -1.0),
            -(r["local_composite_score"] if r["local_composite_score"] is not None else -1.0),
        )
    )

    return {
        "updated_at": REFERENCE_UPDATED_AT,
        "metric_name": "SWE-bench Verified",
        "frontier_leader": {
            "name": FRONTIER_LEADER_NAME,
            "score": FRONTIER_LEADER_SCORE,
        },
        "frontier_baselines": FRONTIER_BASELINES,
        "nvidia_models": nvidia_rows,
        "methodology_note": (
            "As notas locais do ModelArena (0–100) medem acerto em funções/queries isoladas e velocidade real na sua conta. "
            "Já o SWE-bench Verified (referência pública externa) mede a capacidade do modelo de resolver bugs reais em repositórios "
            "multi-arquivo sem quebrar o restante do projeto. Por isso, um modelo pode tirar 100/100 em tarefas isoladas aqui e ainda "
            "estar 25–45 pontos abaixo de Claude Opus 5, DeepSeek-V4 Pro ou GPT-5.6 em edições autônomas de projetos grandes."
        ),
    }
