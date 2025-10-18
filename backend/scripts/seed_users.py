"""
Seed script to create initial users (instructor and admin).

Run this script from the backend directory:
    python scripts/seed_users.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.core.database import AsyncSessionLocal, engine
from src.models.user import User
# Import all models to resolve relationships
from src.models.course import Course
from src.models.module import Module
from src.models.content_item import ContentItem
from src.core.security import hash_password
from sqlalchemy import select
import uuid


async def seed_users():
    """Create instructor and admin users."""

    async with AsyncSessionLocal() as session:

        # Check if users already exist
        result = await session.execute(
            select(User).where(User.email.in_(['instructor@example.com', 'admin@example.com']))
        )
        existing_users = result.scalars().all()
        existing_emails = {user.email for user in existing_users}

        users_created = []

        # Create instructor user
        if 'instructor@example.com' not in existing_emails:
            instructor = User(
                id=str(uuid.uuid4()),
                email='instructor@example.com',
                password_hash=hash_password('password123'),
                first_name='John',
                last_name='Instructor',
                role='instructor',
                is_active=True,
                email_verified=True
            )
            session.add(instructor)
            users_created.append('instructor@example.com')
            print(f"✓ Created instructor user: instructor@example.com / password123")
        else:
            print(f"✓ Instructor user already exists: instructor@example.com")

        # Create admin user
        if 'admin@example.com' not in existing_emails:
            admin = User(
                id=str(uuid.uuid4()),
                email='admin@example.com',
                password_hash=hash_password('admin123'),
                first_name='Admin',
                last_name='User',
                role='admin',
                is_active=True,
                email_verified=True
            )
            session.add(admin)
            users_created.append('admin@example.com')
            print(f"✓ Created admin user: admin@example.com / admin123")
        else:
            print(f"✓ Admin user already exists: admin@example.com")

        if users_created:
            await session.commit()
            print(f"\n✅ Successfully created {len(users_created)} user(s)")
        else:
            print(f"\n✅ All users already exist, no changes made")

    print("\n📋 User Credentials:")
    print("=" * 50)
    print("Instructor:")
    print("  Email: instructor@example.com")
    print("  Password: password123")
    print("\nAdmin:")
    print("  Email: admin@example.com")
    print("  Password: admin123")
    print("=" * 50)


if __name__ == '__main__':
    print("🌱 Seeding users...")
    print()
    asyncio.run(seed_users())
