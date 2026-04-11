"""merge_heads_before_user_refactor

Revision ID: 49c1e52e7409
Revises: 07cd01068927, l9m0n1o2p3q4
Create Date: 2026-04-10 12:03:18.026971

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '49c1e52e7409'
down_revision = ('07cd01068927', 'l9m0n1o2p3q4')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
