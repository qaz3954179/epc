"""add child table

Revision ID: l9m0n1o2p3q4
Revises: k8l9m0n1o2p3
Create Date: 2026-04-09 18:30:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "l9m0n1o2p3q4"
down_revision = "k8l9m0n1o2p3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "child",
        sa.Column("real_name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("nickname", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("gender", sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
        sa.Column("birth_month", sqlmodel.sql.sqltypes.AutoString(length=7), nullable=True),
        sa.Column("avatar_url", sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("child")
