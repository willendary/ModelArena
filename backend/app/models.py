from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from .db import Base


class Run(Base):
    __tablename__ = "benchmark_runs"

    id = Column(Integer, primary_key=True)
    job_id = Column(String(64), index=True, nullable=True)
    model_id = Column(String(255), index=True, nullable=False)
    category = Column(String(80), index=True, nullable=False)
    task_id = Column(String(100), index=True, nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    latency_ms = Column(Float, nullable=True)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    tokens_per_second = Column(Float, nullable=True)
    score = Column(Float, nullable=False, default=0)
    execution_passed = Column(Boolean, nullable=True)
    tests_passed = Column(Integer, nullable=True)
    tests_total = Column(Integer, nullable=True)
    evaluation_json = Column(Text, nullable=True)
    status = Column(String(30), nullable=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BenchmarkJob(Base):
    __tablename__ = "benchmark_jobs"

    id = Column(String(64), primary_key=True)
    trigger = Column(String(30), nullable=False, default="manual")
    status = Column(String(30), nullable=False, default="queued")
    models_json = Column(Text, nullable=False)
    categories_json = Column(Text, nullable=False)
    repeats = Column(Integer, nullable=False, default=1)
    total_steps = Column(Integer, nullable=False, default=0)
    completed_steps = Column(Integer, nullable=False, default=0)
    succeeded_steps = Column(Integer, nullable=False, default=0)
    failed_steps = Column(Integer, nullable=False, default=0)
    current_model = Column(String(255), nullable=True)
    current_category = Column(String(80), nullable=True)
    current_task_id = Column(String(100), nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)


class ScheduleConfig(Base):
    __tablename__ = "schedule_configs"

    id = Column(Integer, primary_key=True, default=1)
    enabled = Column(Boolean, nullable=False, default=False)
    interval_minutes = Column(Integer, nullable=False, default=360)
    model_selection_mode = Column(String(30), nullable=False, default="manual")
    max_auto_models = Column(Integer, nullable=False, default=6)
    models_json = Column(Text, nullable=False, default="[]")
    categories_json = Column(
        Text,
        nullable=False,
        default='["reasoning","coding","debugging","delphi","csharp","firebird"]',
    )
    repeats = Column(Integer, nullable=False, default=1)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_job_id = Column(String(64), nullable=True)
    last_status = Column(String(60), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
