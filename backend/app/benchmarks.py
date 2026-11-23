from __future__ import annotations

from typing import Any

from .evaluator import compute_composite_score, evaluate_answer

CATEGORY_META: dict[str, dict[str, str]] = {
    "reasoning": {
        "label": "Raciocínio",
        "description": "Verificação programática de restrições lógicas e ordenação topológica.",
    },
    "coding": {
        "label": "Programação (Python & SQL)",
        "description": "Testes unitários em sandbox Python isolada e execução real de SQL em SQLite.",
    },
    "debugging": {
        "label": "Debugging",
        "description": "Diagnóstico de causa raiz + validação executável da correção em sandbox Python.",
    },
    "delphi": {
        "label": "Delphi / Pascal",
        "description": "Análise técnica de fronteira de DLL (stdcall/ShareMem) e gestão de memória try..finally.",
    },
    "csharp": {
        "label": "C# / .NET",
        "description": "Análise estrutural de código async/CancellationToken, proteção null e LINQ case-insensitive.",
    },
    "firebird": {
        "label": "Firebird 2.5 SQL",
        "description": "Validação de dialeto Firebird 2.5 (NOT EXISTS, FIRST/ROWS, COALESCE) + execução real.",
    },
}

TASKS: dict[str, list[dict[str, str]]] = {
    "reasoning": [
        {
            "id": "reasoning_constraints_01",
            "title": "Restrições de agendamento (A, B, C)",
            "prompt": (
                "Responda em português. Você tem 3 tarefas: A dura 30 minutos, B dura 20 minutos e C dura 10 minutos. "
                "A deve ocorrer antes de C. B não pode ser a primeira. Apresente uma ordem válida e explique em uma frase. "
                "Use exatamente o formato: ORDEM: ..."
            ),
        },
        {
            "id": "reasoning_deps_02",
            "title": "Ordenação topológica de módulos",
            "prompt": (
                "Responda em português. Cinco módulos têm dependências: B depende de A; C depende de A e B; "
                "D depende de B; E depende de C e D. Apresente uma ordem de compilação válida e indique qual módulo "
                "pode ser compilado imediatamente após A. Use exatamente o formato:\nORDEM: ...\nPROXIMO: ..."
            ),
        },
    ],
    "coding": [
        {
            "id": "coding_python_01",
            "title": "Python: normalize_email (testes unitários)",
            "prompt": (
                "Escreva uma função Python chamada normalize_email(value) que receba uma string, remova espaços nas extremidades "
                "e converta para minúsculas. Para valor None ou não-string, retorne string vazia. "
                "Responda somente com código Python em um bloco ```python."
            ),
        },
        {
            "id": "coding_python_02",
            "title": "Python: merge_intervals (algoritmo + imutabilidade)",
            "prompt": (
                "Escreva uma função Python chamada merge_intervals(intervals) que receba uma lista de tuplas/listas (inicio, fim), "
                "una intervalos sobrepostos ou adjacentes que se tocam (inicio <= fim_anterior) e retorne uma nova lista ordenada "
                "de tuplas (inicio, fim) sem modificar a lista de entrada. Para lista vazia, retorne []. "
                "Responda somente com código Python em um bloco ```python."
            ),
        },
        {
            "id": "coding_sql_01",
            "title": "SQL ANSI: contagem de pedidos por cliente",
            "prompt": (
                "Escreva uma consulta SQL ANSI que liste cada cliente e a quantidade de pedidos, incluindo clientes sem pedidos. "
                "Tabelas: clientes(id, nome), pedidos(id, cliente_id). Use aliases claros. Responda somente com SQL."
            ),
        },
    ],
    "debugging": [
        {
            "id": "debugging_python_01",
            "title": "Debugging: divisão por zero em media()",
            "prompt": (
                "Identifique o bug e apresente uma correção mínima.\n"
                "Código:\n```python\ndef media(valores):\n    return sum(valores) / len(valores)\n```\n"
                "Requisito: lista vazia deve retornar None. Responda com CAUSA: e CORREÇÃO: incluindo a função Python corrigida."
            ),
        },
        {
            "id": "debugging_python_02",
            "title": "Debugging: argumento padrão mutável",
            "prompt": (
                "Identifique o bug e apresente uma correção mínima.\n"
                "Código:\n```python\ndef adicionar_item(item, lista=[]):\n    lista.append(item)\n    return lista\n```\n"
                "Requisito: chamadas consecutivas sem passar `lista` não devem compartilhar estado, mas passar uma lista explícita "
                "deve continuar adicionando nela. Responda com CAUSA: e CORREÇÃO: incluindo a função Python corrigida."
            ),
        },
    ],
    "delphi": [
        {
            "id": "delphi_review_01",
            "title": "Delphi 7: fronteira de DLL e stdcall",
            "prompt": (
                "Em Delphi 7, explique por que uma função exportada de DLL chamada por uma aplicação pode apresentar "
                "incompatibilidade de parâmetros e convenção de chamada. Cite stdcall, tipos compatíveis na fronteira da DLL "
                "e o impacto do gerenciador de memória/ShareMem. Não invente saída de compilação."
            ),
        },
        {
            "id": "delphi_memory_02",
            "title": "Delphi 7: TStringList seguro com try..finally",
            "prompt": (
                "Em Delphi 7 / Object Pascal, escreva uma função `ContarLinhasArquivo(const Caminho: string): Integer` "
                "usando `TStringList` com proteção contra vazamento de memória (`try..finally`) e retorno `0` quando "
                "o arquivo não existir (`FileExists`). Responda apenas com código Delphi."
            ),
        },
    ],
    "csharp": [
        {
            "id": "csharp_async_01",
            "title": "C#: CountAsync com null-safety e CancellationToken",
            "prompt": (
                "Escreva um método C# `async Task<int> CountAsync(IReadOnlyCollection<string> items, CancellationToken cancellationToken)` "
                "que retorne 0 para null (mesmo que o tipo não permita null) e conte itens não vazios após Trim. "
                "Use código compilável, sem bloqueios síncronos (.Result/.Wait) e respeite cancelamento."
            ),
        },
        {
            "id": "csharp_linq_02",
            "title": "C#: agregação de vendas case-insensitive",
            "prompt": (
                "Em C# (.NET 8+), escreva um método estático `public static Dictionary<string, decimal> "
                "SomarVendasPorCliente(IEnumerable<(string Cliente, decimal Valor)> vendas)` que trate entrada nula, "
                "ignore clientes vazios/espaços ou valores negativos, normalize o nome com Trim() e agrupamento "
                "case-insensitive (StringComparer.OrdinalIgnoreCase), retornando os totais somados. Responda somente com código C#."
            ),
        },
    ],
    "firebird": [
        {
            "id": "firebird_sql_01",
            "title": "Firebird 2.5: clientes sem pedidos (NOT EXISTS)",
            "prompt": (
                "Para Firebird 2.5, escreva uma consulta que retorne os clientes sem pedidos usando NOT EXISTS. "
                "Tabelas CLIENTES(ID) e PEDIDOS(ID_CLIENTE). Responda somente SQL."
            ),
        },
        {
            "id": "firebird_sql_02",
            "title": "Firebird 2.5: Top 5 clientes pagos (FIRST/ROWS + COALESCE)",
            "prompt": (
                "Para Firebird 2.5, escreva uma consulta SQL que retorne os 5 clientes com maior valor total em pedidos pagos "
                "(STATUS = 'PAGO'), exibindo ID, NOME e TOTAL_PAGO (usando COALESCE para 0), ordenados do maior para o menor total. "
                "Tabelas: CLIENTES(ID, NOME) e PEDIDOS(ID, ID_CLIENTE, VALOR, STATUS). "
                "Use paginação nativa do Firebird 2.5 (FIRST 5 ou ROWS 1 TO 5, nunca LIMIT). Responda somente SQL."
            ),
        },
    ],
}


def list_categories() -> list[dict[str, Any]]:
    return [
        {
            "id": cat_id,
            "label": CATEGORY_META[cat_id]["label"],
            "description": CATEGORY_META[cat_id]["description"],
            "task_count": len(tasks),
            "tasks": [{"id": t["id"], "title": t["title"]} for t in tasks],
        }
        for cat_id, tasks in TASKS.items()
    ]


def get_tasks(categories: list[str]) -> list[tuple[str, dict[str, str]]]:
    result: list[tuple[str, dict[str, str]]] = []
    seen: set[str] = set()
    for category in categories:
        if category not in TASKS or category in seen:
            continue
        seen.add(category)
        result.extend((category, task) for task in TASKS[category])
    return result


def deterministic_score(category: str, task_id: str, answer: str) -> float:
    """Backward-compatible helper returning the 0-100 score from the real code evaluator."""
    return evaluate_answer(category, task_id, answer)["score"]


__all__ = [
    "CATEGORY_META",
    "TASKS",
    "compute_composite_score",
    "deterministic_score",
    "evaluate_answer",
    "get_tasks",
    "list_categories",
]
