"""create users table

Revision ID: 001
Revises:
Create Date: 2025-01-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create users table with all required fields and indexes."""
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='student'),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('bio', sa.Text, nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('email_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted_at', sa.DateTime, nullable=True),
    )

    # Create indexes
    op.create_index('idx_user_email', 'users', ['email'], unique=True)
    op.create_index('idx_user_role', 'users', ['role'])
    op.create_index('idx_user_active', 'users', ['is_active', 'deleted_at'])

    # Add check constraint for role
    op.create_check_constraint(
        'check_user_role',
        'users',
        "role IN ('student', 'instructor', 'admin')"
    )


def downgrade() -> None:
    """Drop users table and all associated objects."""
    op.drop_index('idx_user_active', table_name='users')
    op.drop_index('idx_user_role', table_name='users')
    op.drop_index('idx_user_email', table_name='users')
    op.drop_table('users')
