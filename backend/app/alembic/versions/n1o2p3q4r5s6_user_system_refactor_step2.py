"""user_system_refactor_step2: add columns, migrate data

Revision ID: n1o2p3q4r5s6
Revises: m0n1o2p3q4r5
Create Date: 2026-04-10 12:31:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "n1o2p3q4r5s6"
down_revision = "m0n1o2p3q4r5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. User 表新增字段
    op.add_column("user", sa.Column("username", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column("user", sa.Column("parent_id", sa.Uuid(), nullable=True))
    op.add_column("user", sa.Column("nickname", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column("user", sa.Column("gender", sqlmodel.sql.sqltypes.AutoString(length=10), nullable=True))
    op.add_column("user", sa.Column("birth_month", sqlmodel.sql.sqltypes.AutoString(length=7), nullable=True))
    op.add_column("user", sa.Column("avatar_url", sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=True))

    # 2. 创建索引和外键
    op.create_index("ix_user_username", "user", ["username"], unique=True)
    op.create_foreign_key("fk_user_parent_id", "user", "user", ["parent_id"], ["id"])

    # 3. email 改为 nullable（宝贝不需要邮箱）
    op.alter_column("user", "email", existing_type=sa.String(length=255), nullable=True)

    # 4. 将现有 role='user' 的用户迁移为 role='parent'
    op.execute("UPDATE \"user\" SET role = 'parent' WHERE role = 'user'")


def downgrade() -> None:
    # 回滚：将 parent 改回 user
    op.execute("UPDATE \"user\" SET role = 'user' WHERE role = 'parent'")
    # 删除 child 用户
    op.execute("DELETE FROM \"user\" WHERE role = 'child'")

    # 恢复 email 为 NOT NULL
    op.alter_column("user", "email", existing_type=sa.String(length=255), nullable=False)

    # 删除外键和约束
    op.drop_constraint("fk_user_parent_id", "user", type_="foreignkey")
    op.drop_index("ix_user_username", table_name="user")

    # 删除新增字段
    op.drop_column("user", "avatar_url")
    op.drop_column("user", "birth_month")
    op.drop_column("user", "gender")
    op.drop_column("user", "nickname")
    op.drop_column("user", "parent_id")
    op.drop_column("user", "username")
