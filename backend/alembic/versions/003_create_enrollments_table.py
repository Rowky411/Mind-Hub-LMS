"""create enrollments table

Revision ID: 003
Revises: 002
Create Date: 2025-01-26

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enrollments table
    op.create_table(
        'enrollments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('student_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.String(36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('enrollment_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('completion_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completion_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('unenrollment_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Create indexes for enrollments
    op.create_index('idx_enrollments_student', 'enrollments', ['student_id'])
    op.create_index('idx_enrollments_course', 'enrollments', ['course_id'])
    op.create_index('idx_enrollments_active', 'enrollments', ['is_active'])
    op.create_index('idx_enrollments_student_active', 'enrollments', ['student_id', 'is_active'])

    # Create unique constraint for one active enrollment per student per course
    op.create_unique_constraint(
        'uq_student_course_enrollment',
        'enrollments',
        ['student_id', 'course_id']
    )


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint('uq_student_course_enrollment', 'enrollments', type_='unique')

    # Drop indexes
    op.drop_index('idx_enrollments_student_active', 'enrollments')
    op.drop_index('idx_enrollments_active', 'enrollments')
    op.drop_index('idx_enrollments_course', 'enrollments')
    op.drop_index('idx_enrollments_student', 'enrollments')

    # Drop table
    op.drop_table('enrollments')
