"""Alter prize url fields max length to 2000

Revision ID: g4h5i6j7k8l9
Revises: f3g4h5i6j7k8
Create Date: 2026-04-07 17:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g4h5i6j7k8l9'
down_revision = 'f3g4h5i6j7k8'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('prize', 'image_url', type_=sa.String(length=2000), existing_type=sa.String(length=500))
    op.alter_column('prize', 'product_url', type_=sa.String(length=2000), existing_type=sa.String(length=500))


def downgrade():
    op.alter_column('prize', 'image_url', type_=sa.String(length=500), existing_type=sa.String(length=2000))
    op.alter_column('prize', 'product_url', type_=sa.String(length=500), existing_type=sa.String(length=2000))
