"""add_sdi_record_table

Revision ID: 944d96ea2d20
Revises: 10e006fe7541
Create Date: 2026-04-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '944d96ea2d20'
down_revision = '10e006fe7541'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sdirecord',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('record_date', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
        sa.Column('period_type', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
        sa.Column('sdi_score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('initiative_score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('exploration_score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('persistence_score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('quality_score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('detail', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_sdirecord_user_id', 'sdirecord', ['user_id'])
    op.create_index('ix_sdirecord_record_date', 'sdirecord', ['record_date'])
    op.create_index('ix_sdirecord_user_date', 'sdirecord', ['user_id', 'record_date'])


def downgrade():
    op.drop_table('sdirecord')
