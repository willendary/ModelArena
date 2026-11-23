TASKS = {
 "reasoning": [
  {"id":"reasoning_constraints_01","prompt":"Responda em português. Você tem 3 tarefas: A dura 30 minutos, B dura 20 minutos e C dura 10 minutos. A deve ocorrer antes de C. B não pode ser a primeira. Apresente uma ordem válida e explique em uma frase. Use exatamente o formato: ORDEM: ..."},
 ],
 "coding": [
  {"id":"coding_python_01","prompt":"Escreva uma função Python chamada normalize_email(value) que receba uma string, remova espaços nas extremidades e converta para minúsculas. Para valor None ou não-string, retorne string vazia. Responda somente com código Python em um bloco ```python."},
  {"id":"coding_sql_01","prompt":"Escreva uma consulta SQL ANSI que liste cada cliente e a quantidade de pedidos, incluindo clientes sem pedidos. Tabelas: clientes(id,nome), pedidos(id,cliente_id). Use aliases claros. Responda somente com SQL."},
 ],
 "debugging": [
  {"id":"debugging_python_01","prompt":"Identifique o bug e apresente uma correção mínima. Código: def media(valores):\n    return sum(valores) / len(valores)\nRequisito: lista vazia deve retornar None. Responda com CAUSA: e CORREÇÃO:."},
 ],
 "delphi": [
  {"id":"delphi_review_01","prompt":"Em Delphi 7, explique por que uma função exportada de DLL chamada por uma aplicação pode apresentar incompatibilidade de parâmetros e convenção de chamada. Cite stdcall e tipos compatíveis na fronteira da DLL. Não invente código de compilação."}
 ],
 "csharp": [
  {"id":"csharp_async_01","prompt":"Escreva um método C# async Task<int> CountAsync(IReadOnlyCollection<string> items, CancellationToken cancellationToken) que retorne 0 para null (mesmo que o tipo não permita null) e conte itens não vazios após Trim. Use código compilável e respeite cancelamento."}
 ],
 "firebird": [
  {"id":"firebird_sql_01","prompt":"Para Firebird 2.5, escreva uma consulta que retorne os clientes sem pedidos usando NOT EXISTS. Tabelas CLIENTES(ID) e PEDIDOS(ID_CLIENTE). Responda somente SQL."}
 ]
}

def get_tasks(categories):
    result = []
    for category in categories:
        if category not in TASKS:
            continue
        result.extend((category, task) for task in TASKS[category])
    return result

def deterministic_score(category: str, task_id: str, answer: str) -> float:
    text = (answer or "").strip()
    if not text:
        return 0.0
    score = 45.0
    lower = text.lower()
    checks = {
      "reasoning": ["ordem:", "a", "b", "c"],
      "coding": ["select", "left join", "count", "group by"] if "sql" in task_id else ["normalize_email", "return", "lower"],
      "debugging": ["causa:", "correção:", "none"],
      "delphi": ["stdcall", "parâmetros"],
      "csharp": ["async", "cancellationtoken", "trim"],
      "firebird": ["not exists", "clientes", "pedidos"]
    }.get(category, [])
    hits = sum(1 for token in checks if token in lower)
    score += (hits / max(len(checks), 1)) * 45
    if len(text) > 80:
        score += 5
    if len(text) > 5000:
        score -= 10
    return round(max(0, min(100, score)), 1)
