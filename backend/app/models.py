from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from .db import Base

class Run(Base):
    __tablename__ = "benchmark_runs"
    id = Column(Integer, primary_key=True)
    model_id = Column(String(255), index=True, nullable=False)
    category = Column(String(80), nullable=False)
    task_id = Column(String(100), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    latency_ms = Column(Float, nullable=True)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    score = Column(Float, nullable=False, default=0)
    status = Column(String(30), nullable=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
