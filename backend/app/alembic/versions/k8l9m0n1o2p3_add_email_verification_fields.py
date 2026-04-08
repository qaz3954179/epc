"""add email verification fields

Revision ID: k8l9m0n1o2p3
Revises: j7k8l9m0n1o2
Create Date: 2026-04-08 15:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

revision = "k8l9m0n1o2p3"
down_revision = "j7k8l9m0n1o2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("email_verification_code", sqlmodel.sql.sqltypes.AutoString(length=6), nullable=True))
    op.add_column("user", sa.Column("email_verification_expires", sa.DateTime(), nullable=True))
    # 已有用户保持激活状态不变


def downgrade() -> None:
    op.drop_column("user", "email_verification_expires")
    op.drop_column("user", "email_verification_code")
