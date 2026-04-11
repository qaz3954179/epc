"""add exam system tables

Revision ID: o2p3q4r5s6t7
Revises: n1o2p3q4r5s6
Create Date: 2026-04-11 13:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


revision = "o2p3q4r5s6t7"
down_revision = "00025251bdde"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ExamTemplate
    op.create_table(
        "examtemplate",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("subject", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("source_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="manual"),
        sa.Column("difficulty", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="medium"),
        sa.Column("question_count", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("time_limit_seconds", sa.Integer(), nullable=True),
        sa.Column("coins_reward_rules", sa.JSON(), nullable=True),
        sa.Column("game_mode", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="classic"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Question
    op.create_table(
        "question",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("question_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("answer", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column("explanation", sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column("difficulty", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="medium"),
        sa.Column("points", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["template_id"], ["examtemplate.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ExamBooking
    op.create_table(
        "exambooking",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("booking_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="self_book"),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="booked"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["template_id"], ["examtemplate.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ExamSession
    op.create_table(
        "examsession",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("booking_id", sa.Uuid(), nullable=True),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("coins_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("combo_max", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accuracy_rate", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="in_progress"),
        sa.ForeignKeyConstraint(["booking_id"], ["exambooking.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["child_id"], ["user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_id"], ["examtemplate.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ExamAnswer
    op.create_table(
        "examanswer",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("child_answer", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("time_spent_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("combo_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answered_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["examsession.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["question.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 索引
    op.create_index("ix_exambooking_child_id", "exambooking", ["child_id"])
    op.create_index("ix_exambooking_scheduled_at", "exambooking", ["scheduled_at"])
    op.create_index("ix_examsession_child_id", "examsession", ["child_id"])
    op.create_index("ix_examanswer_session_id", "examanswer", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_examanswer_session_id", table_name="examanswer")
    op.drop_index("ix_examsession_child_id", table_name="examsession")
    op.drop_index("ix_exambooking_scheduled_at", table_name="exambooking")
    op.drop_index("ix_exambooking_child_id", table_name="exambooking")
    op.drop_table("examanswer")
    op.drop_table("examsession")
    op.drop_table("exambooking")
    op.drop_table("question")
    op.drop_table("examtemplate")
