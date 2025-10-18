"""add course module content tables

Revision ID: 002
Revises: 001
Create Date: 2025-01-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create course_visibility enum (if not exists)
    op.execute("DO $$ BEGIN CREATE TYPE course_visibility AS ENUM ('public', 'private', 'draft'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Create content_type enum (if not exists)
    op.execute("DO $$ BEGIN CREATE TYPE content_type AS ENUM ('video', 'document', 'text', 'quiz', 'assignment'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Create ENUM types for use in table definitions
    course_visibility_enum = postgresql.ENUM('public', 'private', 'draft', name='course_visibility', create_type=False)
    content_type_enum = postgresql.ENUM('video', 'document', 'text', 'quiz', 'assignment', name='content_type', create_type=False)

    # Create courses table
    op.create_table(
        'courses',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('instructor_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('visibility', course_visibility_enum, nullable=False, server_default='draft'),
        sa.Column('enrollment_capacity', sa.Integer(), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Create indexes for courses
    op.create_index('idx_courses_instructor', 'courses', ['instructor_id'])
    op.create_index('idx_courses_visibility', 'courses', ['visibility', 'deleted_at'])
    op.create_index('idx_courses_category', 'courses', ['category'])
    op.create_index('idx_courses_featured', 'courses', ['is_featured', 'visibility'])

    # Create modules table
    op.create_table(
        'modules',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('course_id', sa.String(36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Create indexes for modules
    op.create_index('idx_modules_course', 'modules', ['course_id', 'order_index'])

    # Create content_items table
    op.create_table(
        'content_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('course_id', sa.String(36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content_type', content_type_enum, nullable=False),
        sa.Column('file_url', sa.String(500), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('text_content', sa.Text(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Create indexes for content_items
    op.create_index('idx_content_items_course', 'content_items', ['course_id', 'order_index'])
    op.create_index('idx_content_items_module', 'content_items', ['module_id', 'order_index'])
    op.create_index('idx_content_items_type', 'content_items', ['content_type'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('idx_content_items_type', table_name='content_items')
    op.drop_index('idx_content_items_module', table_name='content_items')
    op.drop_index('idx_content_items_course', table_name='content_items')
    op.drop_table('content_items')

    op.drop_index('idx_modules_course', table_name='modules')
    op.drop_table('modules')

    op.drop_index('idx_courses_featured', table_name='courses')
    op.drop_index('idx_courses_category', table_name='courses')
    op.drop_index('idx_courses_visibility', table_name='courses')
    op.drop_index('idx_courses_instructor', table_name='courses')
    op.drop_table('courses')

    # Drop enums
    op.execute("DROP TYPE IF EXISTS content_type")
    op.execute("DROP TYPE IF EXISTS course_visibility")
