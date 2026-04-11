"""add oauth fields to user

Revision ID: oauth_fields_001
Revises: (auto-detect)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'oauth_fields_001'
down_revision = None  # 需要根据实际最新 revision 调整
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('oauth_provider', sa.String(50), nullable=True))
    op.add_column('user', sa.Column('oauth_id', sa.String(255), nullable=True))
    # 允许 hashed_password 为空（OAuth 用户）
    op.alter_column('user', 'hashed_password', existing_type=sa.String(), server_default='', nullable=True)
    # 复合索引：快速查找 OAuth 用户
    op.create_index('ix_user_oauth', 'user', ['oauth_provider', 'oauth_id'])


def downgrade() -> None:
    op.drop_index('ix_user_oauth', table_name='user')
    op.alter_column('user', 'hashed_password', existing_type=sa.String(), server_default=None, nullable=False)
    op.drop_column('user', 'oauth_id')
    op.drop_column('user', 'oauth_provider')
