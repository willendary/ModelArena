from app.benchmarks import get_tasks, deterministic_score

def test_get_tasks_ignores_unknown_categories():
    assert len(get_tasks(["unknown"])) == 0

def test_debugging_score_rewards_required_sections():
    score = deterministic_score("debugging", "debugging_python_01", "CAUSA: divisão por zero. CORREÇÃO: retornar None.")
    assert score > 45

def test_empty_answer_scores_zero():
    assert deterministic_score("coding", "coding_python_01", "") == 0
