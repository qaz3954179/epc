"""Add task fields to item

Revision ID: a1b2c3d4e5f6
Revises: 1a31ce608336
Create Date: 2026-04-07 11:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    # Add category field to Item table
    op.add_column('item', sa.Column('category', sa.String(length=50), nullable=True))
    
    # Add task_type field to Item table
    op.add_column('item', sa.Column('task_type', sa.String(length=50), nullable=True))
    
    # Add target_count field to Item table
    op.add_column('item', sa.Column('target_count', sa.Integer(), nullable=False, server_default='1'))


def downgrade():
    # Remove the added columns
    op.drop_column('item', 'target_count')
    op.drop_column('item', 'task_type')
    op.drop_column('item', 'category')
