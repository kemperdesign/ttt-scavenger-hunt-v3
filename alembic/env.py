import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic can detect schema changes.
# Adjust this import to match your actual Base location.
from app.db.base import Base  # noqa: E402
target_metadata = Base.metadata

# PostGIS-owned tables — exclude from autogenerate
POSTGIS_TABLES = {
    "spatial_ref_sys", "geography_columns", "geometry_columns",
    "raster_columns", "raster_overviews",
}


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in POSTGIS_TABLES:
        return False
    return True


def render_item(type_, obj, autogen_context):
    """Make GeoAlchemy2 Geometry columns serialize correctly in migration scripts."""
    if type_ == "type" and "geoalchemy2" in str(getattr(obj, "__module__", "")):
        autogen_context.imports.add("import geoalchemy2")
        return (
            f"geoalchemy2.types.Geometry("
            f"geometry_type={obj.geometry_type!r}, srid={obj.srid})"
        )
    return False


def get_url() -> str:
    url = (
        os.environ.get("DATABASE_URL_SYNC")
        or os.environ.get("DATABASE_URL", "")
    )
    # Alembic requires psycopg2, not asyncpg
    return (
        url
        .replace("postgresql+asyncpg://", "postgresql://")
        .replace("postgresql+aiosqlite://", "sqlite:///")
    )


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        render_item=render_item,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section, {})
    cfg["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(cfg, prefix="sqlalchemy.", poolclass=pool.NullPool)

    with connectable.connect() as connection:
        # Ensure PostGIS extensions exist before any migration runs
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        connection.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        connection.commit()

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            render_item=render_item,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
