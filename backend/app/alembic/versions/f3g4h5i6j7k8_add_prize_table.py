"""Add prize table

Revision ID: f3g4h5i6j7k8
Revises: c2d3e4f5g6h7
Create Date: 2026-04-07 16:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'f3g4h5i6j7k8'
down_revision = 'c2d3e4f5g6h7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'prize',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('product_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('coins_cost', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('stock', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('prize')
