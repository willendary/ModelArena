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
