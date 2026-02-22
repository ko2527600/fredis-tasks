from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import SessionLocal, engine, Base, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

# --- SECURITY SETUP ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- DATABASE MODELS ---
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class TaskDB(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")
    due_date = Column(String, nullable=True)
    reminder_time = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str

class TaskSchema(BaseModel):
    id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    completed: bool = False
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    due_date: Optional[str] = None
    reminder_time: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- UTILITY FUNCTIONS ---
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401)
    except JWTError: raise HTTPException(status_code=401)
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None: raise HTTPException(status_code=401)
    return user

# --- PUBLIC ENDPOINTS ---

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = pwd_context.hash(user.password)
    db_user = UserDB(username=user.username, hashed_password=hashed_pwd)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + access_token_expires
    to_encode = {"sub": db_user.username, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + access_token_expires
    to_encode = {"sub": user.username, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}

# --- PRIVATE ENDPOINTS ---

@app.get("/tasks", response_model=List[TaskSchema])
def get_tasks(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    # ONLY return tasks where owner_id matches the logged-in user
    return db.query(TaskDB).filter(TaskDB.owner_id == current_user.id).all()

@app.post("/tasks", response_model=TaskSchema)
def create_task(task: TaskSchema, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = TaskDB(
        title=task.title,
        completed=task.completed,
        priority=task.priority,
        due_date=task.due_date,
        reminder_time=task.reminder_time,
        owner_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/tasks/{task_id}", response_model=TaskSchema)
def update_task(task_id: int, updated_task: TaskSchema, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id, TaskDB.owner_id == current_user.id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found or not authorized")
    
    db_task.title = updated_task.title
    db_task.completed = updated_task.completed
    db_task.priority = updated_task.priority
    db_task.due_date = updated_task.due_date
    db_task.reminder_time = updated_task.reminder_time
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    # Ensure the user can only delete their own tasks
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id, TaskDB.owner_id == current_user.id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found or not authorized")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}
