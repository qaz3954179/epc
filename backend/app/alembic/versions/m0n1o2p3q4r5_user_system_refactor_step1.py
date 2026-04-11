"""user_system_refactor_step1: add parent and child to userrole enum

Revision ID: m0n1o2p3q4r5
Revises: 49c1e52e7409
Create Date: 2026-04-10 12:30:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "m0n1o2p3q4r5"
down_revision = "49c1e52e7409"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 添加新的 ENUM 值（必须在单独的迁移中，不能和使用它的 UPDATE 在同一事务）
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'parent'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'child'")


def downgrade() -> None:
    # PostgreSQL 不支持删除 ENUM 值，只能重建整个类型（复杂且危险）
    # 这里留空，实际回滚在 step2 中处理
    pass
