"""add_citizen_portal_fields

Revision ID: b74f5298a003
Revises: a64f5298a002
Create Date: 2026-07-12 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b74f5298a003'
down_revision: Union[str, None] = 'a64f5298a002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add citizen_id to complaints
    op.add_column('complaints', sa.Column('citizen_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_complaints_citizen_id_users', 'complaints', 'users', ['citizen_id'], ['id'], ondelete='SET NULL')

    # Add rating, feedback, reopened_at, reopen_reason to tickets
    op.add_column('tickets', sa.Column('rating', sa.Integer(), nullable=True))
    op.add_column('tickets', sa.Column('feedback', sa.String(length=1000), nullable=True))
    op.add_column('tickets', sa.Column('reopened_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tickets', sa.Column('reopen_reason', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column('tickets', 'reopen_reason')
    op.drop_column('tickets', 'reopened_at')
    op.drop_column('tickets', 'feedback')
    op.drop_column('tickets', 'rating')
    op.drop_constraint('fk_complaints_citizen_id_users', 'complaints', type_='foreignkey')
    op.drop_column('complaints', 'citizen_id')
