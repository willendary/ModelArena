from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def ensure_schema(bind_engine=None) -> None:
    """Create missing tables and apply safe additive column migrations for SQLite."""
    target = bind_engine or engine
    Base.metadata.create_all(bind=target)
    if not str(target.url).startswith("sqlite"):
        return

    inspector = inspect(target)
    if "benchmark_runs" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("benchmark_runs")}
        migrations = [
            ("job_id", "VARCHAR(64)"),
            ("reasoning", "TEXT"),
            ("tokens_per_second", "FLOAT"),
            ("execution_passed", "BOOLEAN"),
            ("tests_passed", "INTEGER"),
            ("tests_total", "INTEGER"),
            ("evaluation_json", "TEXT"),
        ]
        with target.begin() as conn:
            for col_name, col_type in migrations:
                if col_name not in existing:
                    conn.execute(text(f"ALTER TABLE benchmark_runs ADD COLUMN {col_name} {col_type}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
