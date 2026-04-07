"""Add coins fields

Revision ID: c2d3e4f5g6h7
Revises: b1c2d3e4f5g6
Create Date: 2026-04-07 12:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2d3e4f5g6h7'
down_revision = 'b1c2d3e4f5g6'
branch_labels = None
depends_on = None


def upgrade():
    # Add coins field to User table
    op.add_column('user', sa.Column('coins', sa.Integer(), nullable=False, server_default='0'))
    
    # Add coins_reward field to Item table
    op.add_column('item', sa.Column('coins_reward', sa.Integer(), nullable=False, server_default='10'))


def downgrade():
    # Remove the added columns
    op.drop_column('item', 'coins_reward')
    op.drop_column('user', 'coins')
