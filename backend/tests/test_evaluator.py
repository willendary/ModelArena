from app.evaluator import compute_composite_score, evaluate_answer


def test_python_normalize_email_real_execution_and_bug_detection():
    good = """```python
def normalize_email(value):
    if not isinstance(value, str):
        return ""
    return value.strip().lower()
```"""
    res_good = evaluate_answer("coding", "coding_python_01", good)
    assert res_good["score"] == 100.0
    assert res_good["execution_passed"] is True
    assert res_good["tests_passed"] == 7

    buggy = """```python
def normalize_email(value):
    return value.strip().lower()
```"""
    res_buggy = evaluate_answer("coding", "coding_python_01", buggy)
    assert res_buggy["execution_passed"] is False
    assert res_buggy["score"] < 80.0

    malicious = """```python
import os
def normalize_email(value):
    os.system("echo pwned")
    return ""
```"""
    res_mal = evaluate_answer("coding", "coding_python_01", malicious)
    assert res_mal["execution_passed"] is False
    assert res_mal["score"] < 35.0
    assert any("não permitido" in c["detail"].lower() for c in res_mal["criteria"])


def test_python_merge_intervals_tests_immutability():
    good = """```python
def merge_intervals(intervals):
    if not intervals:
        return []
    ordered = sorted((a, b) for a, b in intervals)
    merged = [ordered[0]]
    for start, end in ordered[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged
```"""
    res = evaluate_answer("coding", "coding_python_02", good)
    assert res["score"] == 100.0
    assert res["execution_passed"] is True
    assert res["tests_passed"] == 6

    mutating = """```python
def merge_intervals(intervals):
    intervals.sort()
    return intervals
```"""
    res_mut = evaluate_answer("coding", "coding_python_02", mutating)
    assert res_mut["execution_passed"] is False
    assert res_mut["score"] < 70.0


def test_debugging_mutable_default_real_execution():
    fixed = """CAUSA: O argumento padrão mutável lista=[] é avaliado uma única vez na definição da função e compartilhado entre chamadas.
CORREÇÃO:
```python
def adicionar_item(item, lista=None):
    if lista is None:
        lista = []
    lista.append(item)
    return lista
```"""
    res = evaluate_answer("debugging", "debugging_python_02", fixed)
    assert res["score"] == 100.0
    assert res["execution_passed"] is True

    still_buggy = """CAUSA: lista mutável.
CORREÇÃO:
```python
def adicionar_item(item, lista=[]):
    lista.append(item)
    return lista
```"""
    res_bad = evaluate_answer("debugging", "debugging_python_02", still_buggy)
    assert res_bad["execution_passed"] is False
    assert res_bad["score"] < 80.0


def test_ansi_sql_real_sqlite_execution_catches_count_star_bug():
    good_sql = """```sql
SELECT c.id, c.nome, COUNT(p.id) AS total_pedidos
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
GROUP BY c.id, c.nome;
```"""
    res_good = evaluate_answer("coding", "coding_sql_01", good_sql)
    assert res_good["score"] == 100.0
    assert res_good["execution_passed"] is True

    buggy_count_star = """```sql
SELECT c.id, c.nome, COUNT(*) AS total_pedidos
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
GROUP BY c.id, c.nome;
```"""
    res_buggy = evaluate_answer("coding", "coding_sql_01", buggy_count_star)
    assert res_buggy["execution_passed"] is False
    assert res_buggy["score"] < res_good["score"]

    unsafe_sql = "DROP TABLE clientes;"
    res_unsafe = evaluate_answer("coding", "coding_sql_01", unsafe_sql)
    assert res_unsafe["score"] == 0.0


def test_firebird_sql_dialect_and_execution():
    fb1 = """SELECT c.ID
FROM CLIENTES c
WHERE NOT EXISTS (
    SELECT 1 FROM PEDIDOS p WHERE p.ID_CLIENTE = c.ID
);"""
    res1 = evaluate_answer("firebird", "firebird_sql_01", fb1)
    assert res1["score"] == 100.0
    assert res1["execution_passed"] is True

    fb2_good = """SELECT FIRST 5
    c.ID,
    c.NOME,
    COALESCE(SUM(p.VALOR), 0) AS TOTAL_PAGO
FROM CLIENTES c
LEFT JOIN PEDIDOS p ON p.ID_CLIENTE = c.ID AND p.STATUS = 'PAGO'
GROUP BY c.ID, c.NOME
ORDER BY TOTAL_PAGO DESC;"""
    res2 = evaluate_answer("firebird", "firebird_sql_02", fb2_good)
    assert res2["score"] == 100.0
    assert res2["execution_passed"] is True
    assert res2["tests_passed"] == 5

    fb2_limit_bug = fb2_good.replace("FIRST 5", "") + "\nLIMIT 5;"
    res2_bad = evaluate_answer("firebird", "firebird_sql_02", fb2_limit_bug)
    assert res2_bad["score"] < 80.0


def test_reasoning_verifies_actual_constraints_not_keywords():
    valid = "ORDEM: A, B, C. Como A vem antes de C e B não é a primeira, todas as restrições são atendidas."
    assert evaluate_answer("reasoning", "reasoning_constraints_01", valid)["score"] == 100.0

    invalid_order = "ORDEM: B, A, C. Essa ordem tem A, B e C em português."
    res_invalid = evaluate_answer("reasoning", "reasoning_constraints_01", invalid_order)
    assert res_invalid["execution_passed"] is False
    assert res_invalid["score"] < 80.0

    topo_good = "ORDEM: A, B, C, D, E\nPROXIMO: B"
    assert evaluate_answer("reasoning", "reasoning_deps_02", topo_good)["score"] == 100.0

    topo_bad = "ORDEM: A, C, B, D, E\nPROXIMO: C"
    res_topo_bad = evaluate_answer("reasoning", "reasoning_deps_02", topo_bad)
    assert res_topo_bad["execution_passed"] is False
    assert res_topo_bad["score"] < 70.0


def test_csharp_and_delphi_structural_analyzers():
    cs_good = """```csharp
public async Task<int> CountAsync(IReadOnlyCollection<string> items, CancellationToken cancellationToken)
{
    if (items is null)
        return 0;

    await Task.Yield();
    int count = 0;
    foreach (var item in items)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!string.IsNullOrWhiteSpace(item?.Trim()))
            count++;
    }
    return count;
}
```"""
    assert evaluate_answer("csharp", "csharp_async_01", cs_good)["score"] == 100.0

    delphi_good = """```delphi
function ContarLinhasArquivo(const Caminho: string): Integer;
var
  Lista: TStringList;
begin
  Result := 0;
  if not FileExists(Caminho) then
    Exit;

  Lista := TStringList.Create;
  try
    Lista.LoadFromFile(Caminho);
    Result := Lista.Count;
  finally
    Lista.Free;
  end;
end;
```"""
    assert evaluate_answer("delphi", "delphi_memory_02", delphi_good)["score"] == 100.0

    delphi_leak = """function ContarLinhasArquivo(const Caminho: string): Integer;
var Lista: TStringList;
begin
  Lista := TStringList.Create;
  Lista.LoadFromFile(Caminho);
  Result := Lista.Count;
end;"""
    assert evaluate_answer("delphi", "delphi_memory_02", delphi_leak)["score"] < 70.0


def test_composite_score_weights_quality_reliability_and_speed():
    fast_high = compute_composite_score(95.0, 1.0, 1200.0)
    slow_high = compute_composite_score(95.0, 1.0, 25000.0)
    flaky_high = compute_composite_score(95.0, 0.5, 1200.0)
    assert fast_high > slow_high
    assert fast_high > flaky_high
