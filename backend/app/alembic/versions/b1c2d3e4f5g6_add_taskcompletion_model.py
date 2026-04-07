"""Add TaskCompletion model

Revision ID: b1c2d3e4f5g6
Revises: a1b2c3d4e5f6
Create Date: 2026-04-07 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5g6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Create taskcompletion table
    op.create_table(
        'taskcompletion',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['item.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    # Create indexes for better query performance
    op.create_index('ix_taskcompletion_item_id', 'taskcompletion', ['item_id'])
    op.create_index('ix_taskcompletion_user_id', 'taskcompletion', ['user_id'])
    op.create_index('ix_taskcompletion_completed_at', 'taskcompletion', ['completed_at'])


def downgrade():
    op.drop_index('ix_taskcompletion_completed_at', table_name='taskcompletion')
    op.drop_index('ix_taskcompletion_user_id', table_name='taskcompletion')
    op.drop_index('ix_taskcompletion_item_id', table_name='taskcompletion')
    op.drop_table('taskcompletion')
