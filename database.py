from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Your PostgreSQL Connection URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/To-Do-Task")

# 2. Create the "Engine"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Create a Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base class
Base = declarative_base()

# Secret key to sign our JWT tokens
SECRET_KEY = os.getenv("SECRET_KEY", "your-very-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
