from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "facilities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("area", sa.String(180), nullable=False),
        sa.Column("departments_json", sa.JSON(), nullable=False),
        sa.Column("hours", sa.String(180), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_table(
        "appointment_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("reference", sa.String(32), nullable=False, unique=True, index=True),
        sa.Column("participant_name", sa.String(120), nullable=False),
        sa.Column("facility_id", sa.String(36), sa.ForeignKey("facilities.id"), nullable=False),
        sa.Column("department", sa.String(100), nullable=False),
        sa.Column("preferred_date", sa.Date(), nullable=False),
        sa.Column("language", sa.String(2), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="demo_created"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

def downgrade():
    op.drop_table("appointment_requests")
    op.drop_table("facilities")
