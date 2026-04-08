"""add referral fields to user

Revision ID: j7k8l9m0n1o2
Revises: i6j7k8l9m0n1
Create Date: 2026-04-08 11:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

revision = "j7k8l9m0n1o2"
down_revision = "i6j7k8l9m0n1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. 添加 referral_code 列（先允许 nullable，填充后再加约束）
    op.add_column("user", sa.Column("referral_code", sqlmodel.sql.sqltypes.AutoString(length=16), nullable=True))
    op.add_column("user", sa.Column("referred_by_id", sa.Uuid(), nullable=True))

    # 2. 为已有用户生成唯一推荐码
    op.execute("""
        UPDATE "user"
        SET referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
        WHERE referral_code IS NULL
    """)

    # 3. 设置 NOT NULL + 唯一索引
    op.alter_column("user", "referral_code", nullable=False)
    op.create_unique_constraint("uq_user_referral_code", "user", ["referral_code"])
    op.create_index("ix_user_referral_code", "user", ["referral_code"], unique=True)

    # 4. 外键
    op.create_foreign_key(
        "fk_user_referred_by_id",
        "user", "user",
        ["referred_by_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_user_referred_by_id", "user", type_="foreignkey")
    op.drop_index("ix_user_referral_code", table_name="user")
    op.drop_constraint("uq_user_referral_code", "user", type_="unique")
    op.drop_column("user", "referred_by_id")
    op.drop_column("user", "referral_code")
