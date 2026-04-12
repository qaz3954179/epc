"""add_achievement_phase1_task_completion_fields

Revision ID: b92746120c0c
Revises: fce0ea2209c0
Create Date: 2026-04-12 11:43:44.037956

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'b92746120c0c'
down_revision = 'fce0ea2209c0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('taskcompletion', sa.Column('trigger_type', sa.String(length=30), nullable=True))
    op.add_column('taskcompletion', sa.Column('is_extra', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('taskcompletion', sa.Column('extra_detail', sa.String(length=500), nullable=True))
    op.add_column('taskcompletion', sa.Column('quality_score', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('taskcompletion', 'quality_score')
    op.drop_column('taskcompletion', 'extra_detail')
    op.drop_column('taskcompletion', 'is_extra')
    op.drop_column('taskcompletion', 'trigger_type')
