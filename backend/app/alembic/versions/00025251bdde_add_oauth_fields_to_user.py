"""add oauth fields to user

Revision ID: 00025251bdde
Revises: n1o2p3q4r5s6
Create Date: 2026-04-11 10:23:11.059325

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '00025251bdde'
down_revision = 'n1o2p3q4r5s6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user', sa.Column('oauth_provider', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True))
    op.add_column('user', sa.Column('oauth_id', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True))


def downgrade():
    op.drop_column('user', 'oauth_id')
    op.drop_column('user', 'oauth_provider')
