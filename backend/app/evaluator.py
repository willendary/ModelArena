from __future__ import annotations

import ast
import json
import os
import re
import sqlite3
import subprocess
import sys
from typing import Any

FENCED_CODE_RE = re.compile(r"```([a-zA-Z0-9_#+-]*)\s*\n(.*?)```", re.DOTALL)
SAFE_IMPORT_MODULES = frozenset({"typing", "collections", "collections.abc", "math", "itertools", "functools"})
FORBIDDEN_NAMES = frozenset({
    "open",
    "eval",
    "exec",
    "compile",
    "__import__",
    "getattr",
    "setattr",
    "delattr",
    "globals",
    "locals",
    "vars",
    "dir",
    "breakpoint",
    "input",
    "memoryview",
    "help",
    "exit",
    "quit",
})

SQL_FORBIDDEN_RE = re.compile(
    r"\b(insert|update|delete|drop|alter|create|replace|attach|detach|pragma|vacuum|reindex|truncate|grant|revoke)\b",
    re.I,
)


def extract_code_block(text: str, preferred_langs: tuple[str, ...] = ()) -> tuple[str, bool]:
    """Return (extracted_code, had_fenced_block). Prefers matching language tags."""
    raw = (text or "").strip()
    if not raw:
        return "", False

    matches = FENCED_CODE_RE.findall(raw)
    if matches:
        preferred = {lang.lower() for lang in preferred_langs}
        if preferred:
            for lang, body in matches:
                if lang.strip().lower() in preferred:
                    return body.strip(), True
        return matches[0][1].strip(), True
    return raw, False


def _criterion(name: str, passed: bool, weight: float, detail: str, earned: float | None = None) -> dict[str, Any]:
    points = round(weight if passed else 0.0, 1) if earned is None else round(max(0.0, min(weight, earned)), 1)
    return {
        "name": name,
        "passed": bool(passed),
        "weight": round(float(weight), 1),
        "earned": points,
        "detail": detail,
    }


def _finalize_evaluation(
    evaluator_type: str,
    criteria: list[dict[str, Any]],
    *,
    code_extracted: str | None = None,
    execution_passed: bool | None = None,
    tests_passed: int = 0,
    tests_total: int = 0,
) -> dict[str, Any]:
    total_weight = sum(c["weight"] for c in criteria) or 100.0
    total_earned = sum(c["earned"] for c in criteria)
    score = round(max(0.0, min(100.0, (total_earned / total_weight) * 100.0)), 1)
    passed_count = sum(1 for c in criteria if c["passed"])
    summary = f"{passed_count}/{len(criteria)} critérios aprovados"
    if tests_total > 0:
        summary += f" · {tests_passed}/{tests_total} testes executados com sucesso"
    return {
        "score": score,
        "evaluator_type": evaluator_type,
        "code_extracted": code_extracted,
        "execution_passed": execution_passed,
        "tests_passed": tests_passed,
        "tests_total": tests_total,
        "criteria": criteria,
        "summary": summary,
    }


def check_python_ast_safety(code: str, expected_func: str) -> tuple[bool, bool, str]:
    """Validate Python syntax, required function definition, and AST safety."""
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return False, False, f"Erro de sintaxe Python (linha {exc.lineno}): {exc.msg}"

    found_func = False
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == expected_func:
            found_func = True
        elif isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split(".")[0]
                if alias.name not in SAFE_IMPORT_MODULES and root not in SAFE_IMPORT_MODULES:
                    return True, False, f"Import não permitido na sandbox: {alias.name}"
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            root = mod.split(".")[0]
            if mod not in SAFE_IMPORT_MODULES and root not in SAFE_IMPORT_MODULES:
                return True, False, f"Import não permitido na sandbox: {mod}"
        elif isinstance(node, ast.Name) and node.id in FORBIDDEN_NAMES:
            return True, False, f"Uso de identificador restrito na sandbox: {node.id}"
        elif isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            return True, False, f"Acesso a atributo interno não permitido: {node.attr}"

    if not found_func:
        return True, True, f"Sintaxe válida, mas função `{expected_func}` não foi encontrada."
    return True, True, "Sintaxe válida e aprovada na verificação estática AST."


_SANDBOX_HARNESS = r"""
import json, sys

SAFE_IMPORTS = {"typing", "collections", "collections.abc", "math", "itertools", "functools"}

def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = name.split(".")[0]
    if name not in SAFE_IMPORTS and root not in SAFE_IMPORTS:
        raise ImportError(f"Blocked import: {name}")
    return __import__(name, globals, locals, fromlist, level)

SAFE_BUILTINS = {
    "__import__": _safe_import,
    "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict,
    "enumerate": enumerate, "filter": filter, "float": float, "frozenset": frozenset,
    "int": int, "isinstance": isinstance, "issubclass": issubclass, "len": len,
    "list": list, "map": map, "max": max, "min": min, "next": next, "object": object,
    "range": range, "repr": repr, "reversed": reversed, "round": round, "set": set,
    "slice": slice, "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip,
    "None": None, "True": True, "False": False,
    "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
    "KeyError": KeyError, "IndexError": IndexError, "ZeroDivisionError": ZeroDivisionError,
}

payload = json.loads(sys.stdin.read())
code = payload["code"]
func_name = payload["func_name"]
tests = payload["tests"]
mode = payload.get("mode", "standard")

ns = {"__builtins__": SAFE_BUILTINS}
try:
    exec(compile(code, "<candidate>", "exec"), ns, ns)
except Exception as exc:
    print(json.dumps({"ok": False, "error": f"Erro ao carregar código: {type(exc).__name__}: {exc}", "cases": []}))
    sys.exit(0)

fn = ns.get(func_name)
if not callable(fn):
    print(json.dumps({"ok": False, "error": f"Função {func_name} não encontrada ou não invocável.", "cases": []}))
    sys.exit(0)

cases = []

if mode == "merge_intervals":
    for t in tests:
        inp = [tuple(x) for x in t["input"]]
        orig = list(inp)
        try:
            res = fn(inp)
            norm = [list(x) for x in res] if isinstance(res, (list, tuple)) else res
            no_mutate = (inp == orig)
            ok = (norm == t["expected"]) and no_mutate
            err = None if no_mutate else "A lista de entrada foi mutada."
            cases.append({"name": t["name"], "passed": ok, "expected": t["expected"], "actual": norm, "error": err})
        except Exception as exc:
            cases.append({"name": t["name"], "passed": False, "expected": t["expected"], "actual": None, "error": f"{type(exc).__name__}: {exc}"})
elif mode == "mutable_default":
    try:
        r1 = fn("a")
        r2 = fn("b")
        cases.append({"name": "chamadas_independentes_1", "passed": r1 == ["a"], "expected": ["a"], "actual": r1, "error": None})
        cases.append({"name": "chamadas_independentes_2", "passed": r2 == ["b"], "expected": ["b"], "actual": r2, "error": None})
        cases.append({"name": "sem_estado_compartilhado", "passed": r1 is not r2 and r1 == ["a"], "expected": True, "actual": (r1 is not r2 and r1 == ["a"]), "error": None})
        ext = [10]
        r3 = fn(20, ext)
        cases.append({"name": "lista_explicita_preservada", "passed": r3 == [10, 20] and ext == [10, 20], "expected": [10, 20], "actual": r3, "error": None})
    except Exception as exc:
        cases.append({"name": "execucao", "passed": False, "expected": "sem erro", "actual": None, "error": f"{type(exc).__name__}: {exc}"})
else:
    for t in tests:
        try:
            args = t["args"]
            res = fn(*args)
            expected = t["expected"]
            if isinstance(expected, float) and isinstance(res, (int, float)):
                ok = abs(float(res) - expected) < 1e-6
            else:
                ok = res == expected and type(res) is type(expected) if expected is None else res == expected
            cases.append({"name": t["name"], "passed": bool(ok), "expected": expected, "actual": res, "error": None})
        except Exception as exc:
            cases.append({"name": t["name"], "passed": False, "expected": t["expected"], "actual": None, "error": f"{type(exc).__name__}: {exc}"})

print(json.dumps({"ok": True, "error": None, "cases": cases}))
"""


def run_python_sandbox(
    code: str,
    func_name: str,
    tests: list[dict[str, Any]],
    *,
    mode: str = "standard",
    timeout_seconds: float = 2.5,
) -> dict[str, Any]:
    """Execute AST-verified candidate Python code inside an isolated subprocess."""
    env: dict[str, str] = {}
    if os.name == "nt":
        for key in ("SYSTEMROOT", "WINDIR"):
            if key in os.environ:
                env[key] = os.environ[key]

    payload = json.dumps({"code": code, "func_name": func_name, "tests": tests, "mode": mode})
    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-c", _SANDBOX_HARNESS],
            input=payload,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            env=env,
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": f"Timeout ({timeout_seconds}s) na execução do código Python.", "cases": []}
    except Exception as exc:
        return {"ok": False, "error": f"Falha ao iniciar sandbox Python: {exc}", "cases": []}

    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()[:300]
        return {"ok": False, "error": f"Erro de execução na sandbox: {err}", "cases": []}

    try:
        return json.loads(proc.stdout.strip().splitlines()[-1])
    except Exception as exc:
        return {"ok": False, "error": f"Resposta inválida da sandbox: {exc}", "cases": []}


def _extract_python_function_from_mixed_text(answer: str, func_name: str) -> tuple[str, bool]:
    code, fenced = extract_code_block(answer, ("python", "py"))
    if f"def {func_name}" in code:
        return code, fenced

    # Fallback: try to find any python block or indented def block in prose
    for _, body in FENCED_CODE_RE.findall(answer or ""):
        if f"def {func_name}" in body:
            return body.strip(), True

    match = re.search(rf"(def\s+{re.escape(func_name)}\s*\([^\n]*\):(?:\n(?:[ \t]+.*|))*)", answer or "")
    if match:
        return match.group(1).strip(), False
    return code, fenced


def _evaluate_python_coding(task_id: str, answer: str) -> dict[str, Any]:
    code, had_fence = _extract_python_function_from_mixed_text(
        answer,
        "normalize_email" if task_id == "coding_python_01" else "merge_intervals",
    )
    func_name = "normalize_email" if task_id == "coding_python_01" else "merge_intervals"
    syntax_ok, safe_ok, ast_detail = check_python_ast_safety(code, func_name)

    criteria: list[dict[str, Any]] = [
        _criterion("Sintaxe Python válida", syntax_ok, 15, ast_detail if not syntax_ok else "AST parseado sem erros."),
        _criterion("Segurança estática (AST)", syntax_ok and safe_ok, 10, ast_detail),
    ]

    only_code_format = had_fence and len((answer or "").strip()) <= len(code) + 40
    criteria.append(
        _criterion(
            "Formato solicitado (bloco ```python limpo)",
            only_code_format,
            10,
            "Respondeu com bloco ```python limpo." if only_code_format else "Incluiu texto extra fora do bloco ```python ou omitiu a marcação.",
            earned=10.0 if only_code_format else (5.0 if had_fence else 0.0),
        )
    )

    if task_id == "coding_python_01":
        tests = [
            {"name": "trim_e_minusculas", "args": ["  Alice@Example.COM  "], "expected": "alice@example.com"},
            {"name": "tabs_e_quebra", "args": ["\tBob@Test.Org\n"], "expected": "bob@test.org"},
            {"name": "none_retorna_vazio", "args": [None], "expected": ""},
            {"name": "inteiro_retorna_vazio", "args": [12345], "expected": ""},
            {"name": "lista_retorna_vazio", "args": [["a@b.com"]], "expected": ""},
            {"name": "string_vazia", "args": [""], "expected": ""},
            {"name": "apenas_espacos", "args": ["   "], "expected": ""},
        ]
        mode = "standard"
    else:
        tests = [
            {"name": "lista_vazia", "input": [], "expected": []},
            {"name": "sobrepostos_desordenados", "input": [[8, 10], [1, 3], [2, 6]], "expected": [[1, 6], [8, 10]]},
            {"name": "adjacentes_tocando", "input": [[1, 2], [2, 3], [5, 7]], "expected": [[1, 3], [5, 7]]},
            {"name": "intervalo_aninhado", "input": [[1, 10], [2, 5], [3, 4]], "expected": [[1, 10]]},
            {"name": "disjuntos", "input": [[5, 6], [1, 2], [9, 10]], "expected": [[1, 2], [5, 6], [9, 10]]},
            {"name": "unico_intervalo", "input": [[4, 4]], "expected": [[4, 4]]},
        ]
        mode = "merge_intervals"

    tests_passed = 0
    tests_total = len(tests)
    exec_passed = False

    if syntax_ok and safe_ok and f"def {func_name}" in code:
        run_res = run_python_sandbox(code, func_name, tests, mode=mode)
        cases = run_res.get("cases") or []
        tests_passed = sum(1 for c in cases if c.get("passed"))
        tests_total = len(cases) or len(tests)
        exec_passed = bool(run_res.get("ok")) and tests_passed == tests_total
        failed_names = [
            f"{c['name']} (esperado={c['expected']!r}, obtido={c['actual']!r}{', ' + c['error'] if c.get('error') else ''})"
            for c in cases
            if not c.get("passed")
        ]
        detail = (
            f"Todos os {tests_passed}/{tests_total} casos de teste passaram na sandbox."
            if exec_passed
            else (run_res.get("error") or f"{tests_passed}/{tests_total} passaram. Falhas: {'; '.join(failed_names[:3])}")
        )
        criteria.append(
            _criterion(
                "Execução de testes unitários reais",
                exec_passed,
                65,
                detail,
                earned=65.0 * (tests_passed / max(tests_total, 1)),
            )
        )
    else:
        criteria.append(
            _criterion(
                "Execução de testes unitários reais",
                False,
                65,
                f"Testes não executados: {ast_detail}",
                earned=0.0,
            )
        )

    return _finalize_evaluation(
        "python_sandbox",
        criteria,
        code_extracted=code,
        execution_passed=exec_passed,
        tests_passed=tests_passed,
        tests_total=tests_total,
    )


def _evaluate_python_debugging(task_id: str, answer: str) -> dict[str, Any]:
    text = (answer or "").strip()
    lower = text.lower()
    func_name = "media" if task_id == "debugging_python_01" else "adicionar_item"
    code, _ = _extract_python_function_from_mixed_text(text, func_name)

    has_causa = "causa:" in lower
    has_correcao = "correção:" in lower or "correcao:" in lower
    if task_id == "debugging_python_01":
        explains_root_cause = bool(re.search(r"(zero|zerodivision|vazi|len\s*\(\s*valores\s*\)\s*==\s*0)", lower))
    else:
        explains_root_cause = bool(re.search(r"(mut[áa]vel|padr[ãa]o|default|compartilhad|mesma lista|avaliad[oa] uma)", lower))

    syntax_ok, safe_ok, ast_detail = check_python_ast_safety(code, func_name) if code else (False, False, "Função corrigida não encontrada.")

    criteria = [
        _criterion(
            "Diagnóstico da causa raiz (CAUSA:)",
            has_causa and explains_root_cause,
            20,
            "Explicou corretamente a causa raiz na seção CAUSA:."
            if (has_causa and explains_root_cause)
            else "Seção CAUSA: ausente ou sem explicação técnica precisa do bug.",
            earned=20.0 if (has_causa and explains_root_cause) else (10.0 if (has_causa or explains_root_cause) else 0.0),
        ),
        _criterion(
            "Estrutura da resposta (CORREÇÃO:)",
            has_correcao,
            10,
            "Seção CORREÇÃO: presente." if has_correcao else "Seção CORREÇÃO: não encontrada.",
        ),
        _criterion(
            "Sintaxe e segurança do código corrigido",
            syntax_ok and safe_ok and f"def {func_name}" in code,
            15,
            ast_detail,
        ),
    ]

    if task_id == "debugging_python_01":
        tests = [
            {"name": "lista_vazia_retorna_none", "args": [[]], "expected": None},
            {"name": "media_simples", "args": [[10, 20]], "expected": 15.0},
            {"name": "unico_elemento", "args": [[7]], "expected": 7.0},
            {"name": "positivos_e_negativos", "args": [[-5, 5, 0]], "expected": 0.0},
        ]
        mode = "standard"
        total_expected = len(tests)
    else:
        tests = []
        mode = "mutable_default"
        total_expected = 4

    tests_passed = 0
    tests_total = total_expected
    exec_passed = False

    if syntax_ok and safe_ok and f"def {func_name}" in code:
        run_res = run_python_sandbox(code, func_name, tests, mode=mode)
        cases = run_res.get("cases") or []
        tests_passed = sum(1 for c in cases if c.get("passed"))
        tests_total = len(cases) or total_expected
        exec_passed = bool(run_res.get("ok")) and tests_passed == tests_total
        failed = [c["name"] for c in cases if not c.get("passed")]
        criteria.append(
            _criterion(
                "Correção validada por testes unitários",
                exec_passed,
                55,
                f"{tests_passed}/{tests_total} testes passaram na sandbox."
                if exec_passed
                else (run_res.get("error") or f"{tests_passed}/{tests_total} testes passaram. Falhas: {', '.join(failed)}"),
                earned=55.0 * (tests_passed / max(tests_total, 1)),
            )
        )
    else:
        criteria.append(
            _criterion(
                "Correção validada por testes unitários",
                False,
                55,
                "Código corrigido não pôde ser executado na sandbox.",
                earned=0.0,
            )
        )

    return _finalize_evaluation(
        "python_sandbox",
        criteria,
        code_extracted=code,
        execution_passed=exec_passed,
        tests_passed=tests_passed,
        tests_total=tests_total,
    )


def _clean_sql(answer: str) -> tuple[str, bool]:
    sql, had_fence = extract_code_block(answer, ("sql", "firebird", "psql"))
    # Strip trailing prose after a terminating semicolon if present
    cleaned = sql.strip()
    # Remove single-line and block SQL comments for safety checking, keep original for execution
    return cleaned, had_fence


def _is_safe_readonly_sql(sql: str) -> tuple[bool, str]:
    stripped = re.sub(r"--[^\n]*", "", sql)
    stripped = re.sub(r"/\*.*?\*/", "", stripped, flags=re.DOTALL).strip()
    if not stripped:
        return False, "Consulta SQL vazia."
    statements = [s.strip() for s in stripped.split(";") if s.strip()]
    if len(statements) > 1:
        return False, "Múltiplas instruções SQL não são permitidas."
    stmt = statements[0]
    if not re.match(r"^(select|with)\b", stmt, re.I):
        return False, "A consulta deve iniciar com SELECT ou WITH."
    if SQL_FORBIDDEN_RE.search(stmt):
        return False, "Instrução SQL de escrita/DDL bloqueada pela verificação read-only."
    return True, "Consulta SELECT somente leitura validada."


def _evaluate_ansi_sql(answer: str) -> dict[str, Any]:
    sql, _ = _clean_sql(answer)
    safe_ok, safe_detail = _is_safe_readonly_sql(sql)
    lower = sql.lower()

    has_left_join = bool(re.search(r"\bleft\s+(outer\s+)?join\b", lower))
    has_group_by = "group by" in lower
    criteria = [
        _criterion("SQL somente leitura válido", safe_ok, 15, safe_detail),
        _criterion(
            "Uso de LEFT JOIN e GROUP BY",
            has_left_join and has_group_by,
            15,
            "Inclui LEFT JOIN e GROUP BY para manter clientes sem pedidos."
            if (has_left_join and has_group_by)
            else "Falta LEFT JOIN ou GROUP BY adequado.",
            earned=15.0 if (has_left_join and has_group_by) else (7.5 if (has_left_join or has_group_by) else 0.0),
        ),
    ]

    exec_passed = False
    tests_passed = 0
    tests_total = 4

    if safe_ok:
        conn = sqlite3.connect(":memory:")
        try:
            conn.executescript(
                """
                CREATE TABLE clientes (id INTEGER PRIMARY KEY, nome TEXT NOT NULL);
                CREATE TABLE pedidos (id INTEGER PRIMARY KEY, cliente_id INTEGER NOT NULL);
                INSERT INTO clientes VALUES (1, 'Ana'), (2, 'Bruno'), (3, 'Carla'), (4, 'Diego');
                INSERT INTO pedidos VALUES (10, 1), (11, 1), (12, 3);
                """
            )
            cur = conn.execute(sql)
            rows = cur.fetchall()
            expected = {"Ana": 2, "Bruno": 0, "Carla": 1, "Diego": 0}
            observed: dict[str, int] = {}
            for row in rows:
                name_val = next((v for v in row if isinstance(v, str) and v in expected), None)
                # Pick last integer column (typically count) rather than client id
                int_vals = [v for v in row if isinstance(v, int)]
                if name_val is not None and int_vals:
                    count_val = int_vals[-1]
                    observed[name_val] = count_val

            tests_passed = sum(1 for k, v in expected.items() if observed.get(k) == v)
            exec_passed = (len(rows) == 4) and (tests_passed == 4)
            if exec_passed:
                detail = "Execução real em SQLite retornou exatamente os 4 clientes e suas contagens (incluindo 0 pedidos)."
            else:
                detail = f"Execução retornou {observed} (esperado {expected}; linhas={len(rows)}). Atenção: COUNT(*) conta 1 em vez de 0 para clientes sem pedidos."
            criteria.append(
                _criterion(
                    "Execução real em banco SQLite (resultado exato)",
                    exec_passed,
                    70,
                    detail,
                    earned=70.0 * (tests_passed / 4.0) * (1.0 if len(rows) == 4 else 0.75),
                )
            )
        except Exception as exc:
            criteria.append(
                _criterion(
                    "Execução real em banco SQLite (resultado exato)",
                    False,
                    70,
                    f"Erro ao executar SQL: {exc}",
                    earned=0.0,
                )
            )
        finally:
            conn.close()
    else:
        criteria.append(_criterion("Execução real em banco SQLite (resultado exato)", False, 70, safe_detail, earned=0.0))

    return _finalize_evaluation(
        "sql_execution",
        criteria,
        code_extracted=sql,
        execution_passed=exec_passed,
        tests_passed=tests_passed,
        tests_total=tests_total,
    )


def _translate_firebird_pagination_to_sqlite(sql: str) -> str:
    """Translate Firebird 2.5 FIRST N / ROWS 1 TO N pagination to SQLite LIMIT for execution testing."""
    translated = sql.strip().rstrip(";")
    first_match = re.search(r"\bselect\s+first\s+(\d+)\b", translated, re.I)
    if first_match:
        n = first_match.group(1)
        translated = re.sub(r"\bselect\s+first\s+\d+\b", "SELECT", translated, count=1, flags=re.I)
        if not re.search(r"\blimit\s+\d+\b", translated, re.I):
            translated = f"{translated} LIMIT {n}"
    rows_match = re.search(r"\brows\s+(\d+)\s+to\s+(\d+)\b", translated, re.I)
    if rows_match:
        start, end = int(rows_match.group(1)), int(rows_match.group(2))
        count = max(0, end - start + 1)
        offset = max(0, start - 1)
        translated = re.sub(r"\brows\s+\d+\s+to\s+\d+\b", f"LIMIT {count} OFFSET {offset}", translated, count=1, flags=re.I)
    return translated


def _evaluate_firebird(task_id: str, answer: str) -> dict[str, Any]:
    sql, _ = _clean_sql(answer)
    safe_ok, safe_detail = _is_safe_readonly_sql(sql)
    lower = sql.lower()
    has_non_fb_syntax = bool(re.search(r"(\blimit\s+\d+|\bilike\b|`|\btop\s+\d+)", lower))

    if task_id == "firebird_sql_01":
        has_not_exists = bool(re.search(r"\bnot\s+exists\s*\(", lower))
        criteria = [
            _criterion("SQL somente leitura válido", safe_ok, 15, safe_detail),
            _criterion(
                "Uso obrigatório de NOT EXISTS",
                has_not_exists,
                20,
                "Subconsulta correlacionada NOT EXISTS encontrada." if has_not_exists else "Consulta não utiliza NOT EXISTS.",
            ),
            _criterion(
                "Compatibilidade de dialeto Firebird 2.5",
                not has_non_fb_syntax,
                10,
                "Sem sintaxe incompatível com Firebird 2.5." if not has_non_fb_syntax else "Usa sintaxe incompatível com Firebird 2.5 (LIMIT/TOP/ILIKE/crase).",
            ),
        ]

        exec_passed = False
        tests_passed = 0
        tests_total = 2
        if safe_ok:
            conn = sqlite3.connect(":memory:")
            try:
                conn.executescript(
                    """
                    CREATE TABLE CLIENTES (ID INTEGER PRIMARY KEY);
                    CREATE TABLE PEDIDOS (ID_CLIENTE INTEGER);
                    INSERT INTO CLIENTES VALUES (1), (2), (3), (4);
                    INSERT INTO PEDIDOS VALUES (1), (3), (3);
                    """
                )
                rows = conn.execute(sql).fetchall()
                ids = sorted(row[0] for row in rows if row and isinstance(row[0], int))
                expected = [2, 4]
                tests_passed = sum(1 for x in expected if x in ids) if len(ids) <= 4 else 0
                exec_passed = ids == expected
                criteria.append(
                    _criterion(
                        "Execução real dos clientes sem pedidos",
                        exec_passed,
                        55,
                        f"Retornou exatamente os IDs sem pedidos {expected}."
                        if exec_passed
                        else f"IDs retornados: {ids} (esperado {expected}).",
                        earned=55.0 if exec_passed else (20.0 if set(expected).issubset(set(ids)) else 0.0),
                    )
                )
            except Exception as exc:
                criteria.append(_criterion("Execução real dos clientes sem pedidos", False, 55, f"Erro ao executar SQL: {exc}", earned=0.0))
            finally:
                conn.close()
        else:
            criteria.append(_criterion("Execução real dos clientes sem pedidos", False, 55, safe_detail, earned=0.0))

        return _finalize_evaluation(
            "firebird_sql",
            criteria,
            code_extracted=sql,
            execution_passed=exec_passed,
            tests_passed=tests_passed,
            tests_total=tests_total,
        )

    # firebird_sql_02: Top 5 clients by paid orders using Firebird 2.5 FIRST 5 / ROWS 1 TO 5 + COALESCE
    has_fb_pagination = bool(re.search(r"(\bfirst\s+5\b|\brows\s+1\s+to\s+5\b)", lower))
    has_coalesce = "coalesce" in lower
    has_pago_filter = bool(re.search(r"status\s*=\s*'pago'", lower))
    criteria = [
        _criterion("SQL somente leitura válido", safe_ok, 10, safe_detail),
        _criterion(
            "Paginação nativa Firebird 2.5 (FIRST 5 ou ROWS 1 TO 5)",
            has_fb_pagination and not has_non_fb_syntax,
            25,
            "Usa paginação nativa Firebird 2.5 sem LIMIT/TOP."
            if (has_fb_pagination and not has_non_fb_syntax)
            else "Falta FIRST 5 / ROWS 1 TO 5 ou utilizou LIMIT/TOP incompatível com Firebird 2.5.",
        ),
        _criterion(
            "Uso de COALESCE e filtro STATUS = 'PAGO'",
            has_coalesce and has_pago_filter,
            15,
            "Inclui COALESCE e filtro de pedidos pagos."
            if (has_coalesce and has_pago_filter)
            else "Falta COALESCE ou filtro STATUS = 'PAGO'.",
            earned=15.0 if (has_coalesce and has_pago_filter) else (7.5 if (has_coalesce or has_pago_filter) else 0.0),
        ),
    ]

    exec_passed = False
    tests_passed = 0
    tests_total = 5
    if safe_ok:
        sqlite_sql = _translate_firebird_pagination_to_sqlite(sql)
        conn = sqlite3.connect(":memory:")
        try:
            conn.executescript(
                """
                CREATE TABLE CLIENTES (ID INTEGER PRIMARY KEY, NOME TEXT NOT NULL);
                CREATE TABLE PEDIDOS (ID INTEGER PRIMARY KEY, ID_CLIENTE INTEGER, VALOR REAL, STATUS TEXT);
                INSERT INTO CLIENTES VALUES
                    (1, 'Alpha'), (2, 'Beta'), (3, 'Gamma'), (4, 'Delta'),
                    (5, 'Epsilon'), (6, 'Zeta'), (7, 'Omega');
                INSERT INTO PEDIDOS VALUES
                    (1, 1, 300.0, 'PAGO'),
                    (2, 1, 200.0, 'PAGO'),
                    (3, 1, 999.0, 'CANCELADO'),
                    (4, 2, 450.0, 'PAGO'),
                    (5, 3, 400.0, 'PAGO'),
                    (6, 4, 250.0, 'PAGO'),
                    (7, 5, 100.0, 'PAGO'),
                    (8, 6, 50.0, 'PAGO'),
                    (9, 7, 800.0, 'PENDENTE');
                """
            )
            rows = conn.execute(sqlite_sql).fetchall()
            expected = [
                (1, "Alpha", 500.0),
                (2, "Beta", 450.0),
                (3, "Gamma", 400.0),
                (4, "Delta", 250.0),
                (5, "Epsilon", 100.0),
            ]
            for idx, exp in enumerate(expected):
                if idx < len(rows):
                    row = rows[idx]
                    if (
                        len(row) >= 3
                        and row[0] == exp[0]
                        and row[1] == exp[1]
                        and abs(float(row[2]) - exp[2]) < 1e-4
                    ):
                        tests_passed += 1
            exec_passed = len(rows) == 5 and tests_passed == 5
            criteria.append(
                _criterion(
                    "Execução real do Top 5 (valores e ordenação)",
                    exec_passed,
                    50,
                    "Top 5 clientes e totais pagos retornados na ordem exata."
                    if exec_passed
                    else f"Acertou {tests_passed}/5 posições (linhas={len(rows)}; obtido={rows[:5]}).",
                    earned=50.0 * (tests_passed / 5.0) * (1.0 if len(rows) == 5 else 0.75),
                )
            )
        except Exception as exc:
            criteria.append(_criterion("Execução real do Top 5 (valores e ordenação)", False, 50, f"Erro ao executar SQL: {exc}", earned=0.0))
        finally:
            conn.close()
    else:
        criteria.append(_criterion("Execução real do Top 5 (valores e ordenação)", False, 50, safe_detail, earned=0.0))

    return _finalize_evaluation(
        "firebird_sql",
        criteria,
        code_extracted=sql,
        execution_passed=exec_passed,
        tests_passed=tests_passed,
        tests_total=tests_total,
    )


def _balanced_delimiters(code: str) -> bool:
    stack: list[str] = []
    pairs = {")": "(", "}": "{", "]": "["}
    in_str: str | None = None
    escaped = False
    for ch in code:
        if in_str:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in ('"', "'"):
            in_str = ch
        elif ch in "({[":
            stack.append(ch)
        elif ch in ")}]":
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return not stack


def _evaluate_csharp(task_id: str, answer: str) -> dict[str, Any]:
    code, _ = extract_code_block(answer, ("csharp", "cs", "c#"))
    balanced = bool(code) and _balanced_delimiters(code)

    if task_id == "csharp_async_01":
        has_sig = bool(
            re.search(
                r"\basync\s+Task<int>\s+CountAsync\s*\(\s*IReadOnlyCollection<string>\??\s+\w+\s*,\s*CancellationToken\s+\w+",
                code,
            )
        )
        has_null_guard = bool(re.search(r"(\bis\s+null\b|==\s*null)", code)) and bool(re.search(r"return\s+0\s*;", code))
        has_cancel = bool(re.search(r"(ThrowIfCancellationRequested|IsCancellationRequested|cancellationToken)", code))
        has_trim_check = bool(
            re.search(r"(Trim\s*\(\s*\)|IsNullOrWhiteSpace)", code)
        )
        no_blocking = not bool(re.search(r"(\.Result\b|\.Wait\s*\(|Thread\.Sleep)", code))
        has_await = "await " in code or "Task.FromResult" in code or "Task.Yield" in code or "Task.Run" in code

        criteria = [
            _criterion("Delimitadores e estrutura C# balanceados", balanced, 15, "Chaves e parênteses balanceados." if balanced else "Código vazio ou chaves/parênteses desbalanceados."),
            _criterion("Assinatura exata async Task<int> CountAsync", has_sig, 20, "Assinatura compatível com o contrato solicitado." if has_sig else "Assinatura de CountAsync divergente do solicitado."),
            _criterion("Proteção para null retornando 0", has_null_guard, 20, "Trata coleção nula retornando 0." if has_null_guard else "Falta guarda para entrada null retornando 0."),
            _criterion("Respeito ao CancellationToken", has_cancel, 20, "Verifica/propaga cancelamento corretamente." if has_cancel else "Não verifica nem propaga CancellationToken."),
            _criterion("Contagem correta com Trim / IsNullOrWhiteSpace", has_trim_check, 15, "Filtra itens vazios/espaços corretamente." if has_trim_check else "Falta uso de Trim() ou IsNullOrWhiteSpace."),
            _criterion("Boas práticas async (sem .Result/.Wait)", no_blocking and has_await, 10, "Sem bloqueio síncrono de thread." if (no_blocking and has_await) else "Usa bloqueio síncrono ou método async sem await.", earned=10.0 if (no_blocking and has_await) else (5.0 if no_blocking else 0.0)),
        ]
    else:
        has_sig = bool(
            re.search(
                r"\bpublic\s+static\s+Dictionary<string,\s*decimal>\s+SomarVendasPorCliente\b",
                code,
            )
        )
        has_null_guard = bool(re.search(r"(\bis\s+null\b|==\s*null|\?\.)", code))
        has_validation = bool(re.search(r"(IsNullOrWhiteSpace|Trim\s*\(\s*\))", code)) and bool(re.search(r"(<=\s*0|<\s*0|>=\s*0|>\s*0)", code))
        has_case_insensitive = bool(re.search(r"StringComparer\.OrdinalIgnoreCase|InvariantCultureIgnoreCase", code))
        has_aggregation = bool(re.search(r"(GroupBy|Sum\s*\(|\+=|TryGetValue)", code))
        criteria = [
            _criterion("Delimitadores e estrutura C# balanceados", balanced, 15, "Chaves e parênteses balanceados." if balanced else "Código vazio ou chaves/parênteses desbalanceados."),
            _criterion("Assinatura exata SomarVendasPorCliente", has_sig, 20, "Assinatura estática exata." if has_sig else "Assinatura do método não corresponde ao contrato."),
            _criterion("Guarda contra entrada nula", has_null_guard, 15, "Trata coleção/itens nulos com segurança." if has_null_guard else "Falta proteção contra null."),
            _criterion("Normalização Trim e filtragem de inválidos/negativos", has_validation, 20, "Normaliza nomes e filtra valores negativos/vazios." if has_validation else "Falta Trim/IsNullOrWhiteSpace ou filtro de valores negativos."),
            _criterion("Dicionário case-insensitive (OrdinalIgnoreCase)", has_case_insensitive, 15, "Usa StringComparer.OrdinalIgnoreCase." if has_case_insensitive else "Não garante agrupamento case-insensitive."),
            _criterion("Agregação correta dos valores por cliente", has_aggregation, 15, "Soma vendas agrupadas por cliente." if has_aggregation else "Lógica de soma/agregação ausente."),
        ]

    passed_tests = sum(1 for c in criteria if c["passed"])
    return _finalize_evaluation(
        "csharp_static",
        criteria,
        code_extracted=code,
        execution_passed=all(c["passed"] for c in criteria),
        tests_passed=passed_tests,
        tests_total=len(criteria),
    )


def _evaluate_delphi(task_id: str, answer: str) -> dict[str, Any]:
    text = (answer or "").strip()
    lower = text.lower()

    if task_id == "delphi_review_01":
        has_stdcall = "stdcall" in lower
        has_register_contrast = bool(re.search(r"\b(register|fastcall|cdecl|conven[çc][ãa]o|pilha|stack)\b", lower))
        has_safe_types = bool(re.search(r"\b(pchar|pansichar|widestring|shortstring|integer|double|boolean)\b", lower))
        has_string_memory = bool(re.search(r"\b(sharemem|gerenciador de mem[óo]ria|memory manager|string nativa|ansistring|heap)\b", lower))
        concise_quality = 120 <= len(text) <= 4500

        criteria = [
            _criterion("Explica convenção de chamada stdcall", has_stdcall, 25, "Cita stdcall corretamente." if has_stdcall else "Não mencionou stdcall."),
            _criterion("Contrasta convenção padrão Delphi (register) / pilha", has_register_contrast, 20, "Explica divergência de convenção de chamada/pilha." if has_register_contrast else "Não contrastou com register/pilha."),
            _criterion("Cita tipos seguros na fronteira da DLL", has_safe_types, 25, "Cita PChar/PAnsiChar/WideString/ShortString." if has_safe_types else "Não citou tipos ABI seguros (PChar, WideString, etc.)."),
            _criterion("Explica problema de string e gerenciador de memória (ShareMem)", has_string_memory, 20, "Aborda alocador de memória / ShareMem / AnsiString." if has_string_memory else "Não explicou o conflito de gerenciador de memória/ShareMem."),
            _criterion("Clareza e completude técnica", concise_quality, 10, "Explicação objetiva e bem dimensionada." if concise_quality else "Resposta curta demais ou excessivamente verbosa."),
        ]
        passed = sum(1 for c in criteria if c["passed"])
        return _finalize_evaluation(
            "delphi_static",
            criteria,
            code_extracted=text,
            execution_passed=all(c["passed"] for c in criteria),
            tests_passed=passed,
            tests_total=len(criteria),
        )

    # delphi_memory_02
    code, _ = extract_code_block(text, ("delphi", "pascal", "objectpascal", "pas"))
    clower = code.lower()
    has_sig = bool(re.search(r"\bfunction\s+contarlinhasarquivo\s*\(\s*const\s+\w+\s*:\s*string\s*\)\s*:\s*integer", clower))
    has_file_exists = bool(re.search(r"\bfileexists\s*\(", clower))
    has_create = bool(re.search(r"tstringlist\.create\b", clower))
    has_try_finally_free = bool(
        re.search(r"\btry\b.*?\bfinally\b.*?(freeandnil\s*\(|\.free\b)", clower, re.DOTALL)
    )
    has_load_and_count = ("loadfromfile" in clower) and (".count" in clower) and ("result" in clower)
    open_blocks = len(re.findall(r"\b(begin|try|case)\b", clower))
    end_blocks = len(re.findall(r"\bend\b", clower))
    blocks_balanced = open_blocks > 0 and open_blocks == end_blocks

    criteria = [
        _criterion("Assinatura Delphi ContarLinhasArquivo", has_sig, 20, "Assinatura `function ContarLinhasArquivo(const ...: string): Integer` válida." if has_sig else "Assinatura da função Delphi divergente."),
        _criterion("Verificação FileExists retornando 0", has_file_exists and "0" in clower, 15, "Trata arquivo inexistente com FileExists." if has_file_exists else "Falta checagem FileExists."),
        _criterion("Instanciação de TStringList", has_create, 15, "Usa TStringList.Create." if has_create else "Não instancia TStringList."),
        _criterion("Proteção contra vazamento (try..finally..Free)", has_try_finally_free, 25, "Garante liberação de memória no bloco finally." if has_try_finally_free else "Falta try..finally com .Free ou FreeAndNil."),
        _criterion("Carregamento do arquivo e retorno Count", has_load_and_count, 15, "Usa LoadFromFile e atribui Count a Result." if has_load_and_count else "Falta LoadFromFile, .Count ou Result."),
        _criterion("Balanceamento de blocos begin/try..end", blocks_balanced, 10, f"Blocos balanceados ({open_blocks} aberturas / {end_blocks} end)." if blocks_balanced else f"Blocos desbalanceados ({open_blocks} aberturas / {end_blocks} end)."),
    ]
    passed = sum(1 for c in criteria if c["passed"])
    return _finalize_evaluation(
        "delphi_static",
        criteria,
        code_extracted=code,
        execution_passed=all(c["passed"] for c in criteria),
        tests_passed=passed,
        tests_total=len(criteria),
    )


def _extract_order_tokens(text: str, allowed: set[str]) -> tuple[bool, list[str]]:
    match = re.search(r"ordem\s*:\s*([^\n\r]+)", text, re.I)
    if not match:
        return False, []
    line = match.group(1)
    # Stop before explanation punctuation like '.' or ' - ' if sentence continues on same line
    prefix = re.split(r"[\.;]|\s+porque\b|\s+pois\b|\s+e\s+pr[óo]ximo\b", line, maxsplit=1, flags=re.I)[0]
    tokens = [tok.upper() for tok in re.findall(r"\b([A-Za-z])\b", prefix) if tok.upper() in allowed]
    return True, tokens


def _evaluate_reasoning(task_id: str, answer: str) -> dict[str, Any]:
    text = (answer or "").strip()

    if task_id == "reasoning_constraints_01":
        has_label, tokens = _extract_order_tokens(text, {"A", "B", "C"})
        exact_set = len(tokens) == 3 and set(tokens) == {"A", "B", "C"}
        a_before_c = exact_set and tokens.index("A") < tokens.index("C")
        b_not_first = exact_set and tokens[0] != "B"
        valid_order = exact_set and a_before_c and b_not_first
        has_explanation = len(text) >= 35

        criteria = [
            _criterion("Formato obrigatório ORDEM:", has_label, 15, "Encontrou marcador `ORDEM:`." if has_label else "Não usou o marcador obrigatório `ORDEM:`."),
            _criterion("Contém exatamente as 3 tarefas (A, B, C)", exact_set, 20, f"Ordem extraída: {tokens}." if exact_set else f"Sequência inválida extraída: {tokens}."),
            _criterion("Restrição 1: A ocorre antes de C", a_before_c, 25, "A precede C." if a_before_c else "Violou a restrição A antes de C."),
            _criterion("Restrição 2: B não é a primeira", b_not_first, 25, "B não inicia a sequência." if b_not_first else "Violou a restrição B não pode ser a primeira."),
            _criterion("Explicação concisa em português", has_explanation, 15, "Explicação presente." if has_explanation else "Explicação ausente ou curta demais."),
        ]
        return _finalize_evaluation(
            "reasoning_verifier",
            criteria,
            code_extracted=f"ORDEM: {', '.join(tokens)}" if tokens else None,
            execution_passed=valid_order,
            tests_passed=sum(1 for x in (exact_set, a_before_c, b_not_first) if x),
            tests_total=3,
        )

    # reasoning_deps_02: A -> B, A -> C, B -> C, B -> D, C -> E, D -> E
    has_label, tokens = _extract_order_tokens(text, {"A", "B", "C", "D", "E"})
    exact_set = len(tokens) == 5 and set(tokens) == {"A", "B", "C", "D", "E"}
    edges = [("A", "B"), ("A", "C"), ("B", "C"), ("B", "D"), ("C", "E"), ("D", "E")]
    satisfied_edges = 0
    broken_edges: list[str] = []
    if exact_set:
        for u, v in edges:
            if tokens.index(u) < tokens.index(v):
                satisfied_edges += 1
            else:
                broken_edges.append(f"{u}->{v}")

    next_match = re.search(r"pr[óo]ximo\s*:\s*([^\n\r]+)", text, re.I)
    next_tokens = re.findall(r"\b([A-Ea-e])\b", next_match.group(1)) if next_match else []
    next_ok = bool(next_tokens) and next_tokens[0].upper() == "B"

    topo_ok = exact_set and satisfied_edges == len(edges)
    criteria = [
        _criterion("Formato ORDEM: com todos os 5 módulos", has_label and exact_set, 20, f"Ordem extraída: {tokens}." if exact_set else f"Ordem incompleta ou ausente: {tokens}."),
        _criterion(
            "Ordenação topológica válida (6 dependências)",
            topo_ok,
            55,
            "Todas as 6 dependências respeitadas."
            if topo_ok
            else (f"{satisfied_edges}/6 dependências satisfeitas. Quebradas: {', '.join(broken_edges)}" if exact_set else "Sequência inválida."),
            earned=55.0 * (satisfied_edges / len(edges)) if exact_set else 0.0,
        ),
        _criterion(
            "Identificação correta de PROXIMO: B",
            next_ok,
            25,
            "Identificou corretamente B como módulo imediatamente compilável após A."
            if next_ok
            else f"Esperado PROXIMO: B (encontrado: {next_tokens[:2]}).",
        ),
    ]
    return _finalize_evaluation(
        "reasoning_verifier",
        criteria,
        code_extracted=f"ORDEM: {', '.join(tokens)} | PROXIMO: {next_tokens[0].upper() if next_tokens else '?'}",
        execution_passed=topo_ok and next_ok,
        tests_passed=satisfied_edges + (1 if next_ok else 0),
        tests_total=len(edges) + 1,
    )


def evaluate_answer(category: str, task_id: str, answer: str) -> dict[str, Any]:
    """Evaluate a model answer using real sandbox execution, SQL execution, or static/logic verification."""
    text = (answer or "").strip()
    if not text:
        return _finalize_evaluation(
            "empty",
            [_criterion("Resposta não vazia", False, 100, "O modelo retornou resposta vazia.")],
            code_extracted=None,
            execution_passed=False,
            tests_passed=0,
            tests_total=1,
        )

    if category == "coding":
        if "sql" in task_id:
            return _evaluate_ansi_sql(text)
        return _evaluate_python_coding(task_id, text)
    if category == "debugging":
        return _evaluate_python_debugging(task_id, text)
    if category == "firebird":
        return _evaluate_firebird(task_id, text)
    if category == "csharp":
        return _evaluate_csharp(task_id, text)
    if category == "delphi":
        return _evaluate_delphi(task_id, text)
    if category == "reasoning":
        return _evaluate_reasoning(task_id, text)

    return _finalize_evaluation(
        "fallback",
        [_criterion("Resposta fornecida", True, 100, "Categoria sem rubrica especializada.")],
        code_extracted=text,
        execution_passed=None,
    )


def compute_composite_score(
    avg_quality: float,
    success_rate: float,
    avg_latency_ms: float | None,
) -> float:
    """Compute overall programming suitability score (75% quality, 15% reliability, 10% speed)."""
    quality_part = max(0.0, min(100.0, float(avg_quality))) * 0.75
    reliability_part = max(0.0, min(1.0, float(success_rate))) * 100.0 * 0.15
    if avg_latency_ms is None or avg_latency_ms <= 0:
        speed_score = 50.0
    else:
        # <= 1500ms -> 100, 30000ms+ -> 10
        speed_score = max(10.0, min(100.0, 100.0 - ((avg_latency_ms - 1500.0) / 285.0)))
    speed_part = speed_score * 0.10
    return round(max(0.0, min(100.0, quality_part + reliability_part + speed_part)), 1)
