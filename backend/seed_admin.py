import os
import sys

# Add the backend directory to sys.path to allow importing from models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from auth import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@cvai.com"
        admin_password = "AdminPassword123!"
        
        # Check if admin already exists
        user = db.query(User).filter(User.email == admin_email).first()
        if user:
            print(f"Admin user {admin_email} already exists.")
            # Ensure it has admin privileges
            if not user.is_admin:
                user.is_admin = True
                db.commit()
                print(f"Updated existing user {admin_email} to have admin privileges.")
            return

        hashed_password = get_password_hash(admin_password)
        admin_user = User(
            name="System Admin",
            email=admin_email,
            password_hash=hashed_password,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Successfully seeded admin user:\nEmail: {admin_email}\nPassword: {admin_password}")
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
