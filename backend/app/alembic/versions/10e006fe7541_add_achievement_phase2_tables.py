"""add_achievement_phase2_tables

Revision ID: 10e006fe7541
Revises: b92746120c0c
Create Date: 2026-04-12 11:52:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '10e006fe7541'
down_revision = 'b92746120c0c'
branch_labels = None
depends_on = None


def upgrade():
    # Achievement 成就定义表
    op.create_table(
        'achievement',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('icon', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('reveal_message', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=False),
        sa.Column('category', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('condition_type', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('condition_config', sa.JSON(), nullable=True),
        sa.Column('coins_bonus', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # UserAchievement 用户成就解锁记录表
    op.create_table(
        'userachievement',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('achievement_id', sa.Uuid(), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(), nullable=False),
        sa.Column('trigger_snapshot', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievement.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_userachievement_user_id', 'userachievement', ['user_id'])
    op.create_index('ix_userachievement_achievement_id', 'userachievement', ['achievement_id'])

    # AchievementNotification 成就通知队列表
    op.create_table(
        'achievementnotification',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('achievement_id', sa.Uuid(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievement.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_achievementnotification_user_id', 'achievementnotification', ['user_id'])


def downgrade():
    op.drop_table('achievementnotification')
    op.drop_table('userachievement')
    op.drop_table('achievement')
