"""Add wish planet system tables

Revision ID: p3q4r5s6t7u8
Revises: 6212fd6c6a66
Create Date: 2026-04-23 20:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'p3q4r5s6t7u8'
down_revision = '6212fd6c6a66'
branch_labels = None
depends_on = None


def upgrade():
    # ─── wish ───────────────────────────────────────────────────
    op.create_table('wish',
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('category', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
        sa.Column('emoji', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('child_id', sa.Uuid(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('parent_response', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['child_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ─── wishplanet ─────────────────────────────────────────────
    op.create_table('wishplanet',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('color', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('emoji', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('wish_id', sa.Uuid(), nullable=False),
        sa.Column('child_id', sa.Uuid(), nullable=False),
        sa.Column('stage', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('brightness', sa.Integer(), nullable=False),
        sa.Column('total_milestones', sa.Integer(), nullable=False),
        sa.Column('completed_milestones', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('born_at', sa.DateTime(), nullable=True),
        sa.Column('last_activity_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['child_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['wish_id'], ['wish.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('wish_id')
    )

    # ─── planetmilestone ────────────────────────────────────────
    op.create_table('planetmilestone',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('milestone_type', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('target_value', sa.Integer(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('planet_id', sa.Uuid(), nullable=False),
        sa.Column('current_value', sa.Integer(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['planet_id'], ['wishplanet.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # ─── knowledgecard ──────────────────────────────────────────
    op.create_table('knowledgecard',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(length=5000), nullable=False),
        sa.Column('fun_fact', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('difficulty', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('planet_id', sa.Uuid(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['planet_id'], ['wishplanet.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('knowledgecard')
    op.drop_table('planetmilestone')
    op.drop_table('wishplanet')
    op.drop_table('wish')
