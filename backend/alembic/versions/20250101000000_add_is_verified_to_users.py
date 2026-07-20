"""add is_verified to users

Revision ID: 20250101000000
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250101000000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add is_verified column to users table."""
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Remove is_verified column from users table."""
    op.drop_column('users', 'is_verified')
