"""Add coding project table

Revision ID: fce0ea2209c0
Revises: o2p3q4r5s6t7
Create Date: 2026-04-11 14:12:40.645323

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'fce0ea2209c0'
down_revision = 'o2p3q4r5s6t7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('codingproject',
    sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
    sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
    sa.Column('blockly_xml', sqlmodel.sql.sqltypes.AutoString(length=100000), nullable=False),
    sa.Column('generated_code', sqlmodel.sql.sqltypes.AutoString(length=100000), nullable=True),
    sa.Column('thumbnail_url', sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=True),
    sa.Column('is_public', sa.Boolean(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('codingproject')
