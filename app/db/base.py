"""
SQLAlchemy declarative base — import all models here so Alembic autogenerates correctly.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models so they're registered on Base.metadata
from app.models.user import User  # noqa: F401, E402
from app.models.adventure import Adventure  # noqa: F401, E402
from app.models.stop import Stop  # noqa: F401, E402
from app.models.challenge import Challenge, ChallengeAttempt, ConversationMessage  # noqa: F401, E402
from app.models.session import GameSession  # noqa: F401, E402
from app.models.team import Team, TeamMember  # noqa: F401, E402
from app.models.badge import Badge, UserBadge  # noqa: F401, E402
from app.models.submission import PhotoSubmission  # noqa: F401, E402
from app.models.audit_log import AuditLog  # noqa: F401, E402
from app.models.token_blacklist import TokenBlacklist  # noqa: F401, E402
