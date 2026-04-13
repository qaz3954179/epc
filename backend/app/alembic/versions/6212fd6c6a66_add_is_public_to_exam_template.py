"""add_is_public_to_exam_template

Revision ID: 6212fd6c6a66
Create Date: 2026-04-13
"""
from alembic import op
import sqlalchemy as sa

revision = "6212fd6c6a66"
down_revision = "944d96ea2d20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "examtemplate",
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("examtemplate", "is_public")
