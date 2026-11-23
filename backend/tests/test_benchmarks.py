from app.benchmarks import deterministic_score, get_tasks, list_categories


def test_get_tasks_ignores_unknown_categories_and_deduplicates():
    assert len(get_tasks(["unknown"])) == 0
    coding_once = get_tasks(["coding"])
    coding_dup = get_tasks(["coding", "coding"])
    assert len(coding_once) == len(coding_dup) == 3


def test_list_categories_exposes_all_six_suites():
    cats = list_categories()
    ids = {c["id"] for c in cats}
    assert ids == {"reasoning", "coding", "debugging", "delphi", "csharp", "firebird"}
    assert sum(c["task_count"] for c in cats) == 13


def test_debugging_score_rewards_working_fix_and_sections():
    good = (
        "CAUSA: Quando a lista está vazia ocorre ZeroDivisionError.\n"
        "CORREÇÃO:\n```python\ndef media(valores):\n    if not valores:\n        return None\n    return sum(valores) / len(valores)\n```"
    )
    score = deterministic_score("debugging", "debugging_python_01", good)
    assert score == 100.0


def test_empty_answer_scores_zero():
    assert deterministic_score("coding", "coding_python_01", "") == 0.0
