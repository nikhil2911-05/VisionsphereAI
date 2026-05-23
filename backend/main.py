import subprocess
import sys

# Automatically verify and install required backend packages
required_packages = ["ultralytics", "motor", "pymongo"]
print("Checking and updating backend library dependencies...")
try:
    for pkg in required_packages:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", pkg])
    print("All backend dependencies are verified and up to date!")
except Exception as e:
    print(f"Warning: Automatic dependency checks encountered an issue: {e}")

import os
import logging
import urllib.request
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, File, UploadFile, Security, HTTPException, status, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from ultralytics import YOLO
from PIL import Image
import io
import datetime

# Setup standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("MLOps-Training")

# Setup database and auth helper structures
import motor.motor_asyncio
import hashlib
import secrets
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio

MONGO_DETAILS = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

# SMTP Email Configuration — reads from smtp_config.py for easy setup
# Fallback: also checks environment variables
SMTP_EMAIL = ""
SMTP_APP_PASSWORD = ""
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

try:
    from smtp_config import SMTP_EMAIL as _cfg_email, SMTP_APP_PASSWORD as _cfg_pass
    if _cfg_email and _cfg_pass:
        SMTP_EMAIL = _cfg_email.strip()
        SMTP_APP_PASSWORD = _cfg_pass.strip()
        print(f"✅ SMTP config loaded from smtp_config.py (sender: {SMTP_EMAIL})")
    else:
        print("⚠️  smtp_config.py found but credentials are empty. Email delivery disabled.")
except ImportError:
    print("ℹ️  No smtp_config.py found, checking environment variables...")

# Override with env vars if set
if os.getenv("SMTP_EMAIL"):
    SMTP_EMAIL = os.getenv("SMTP_EMAIL", "").strip()
if os.getenv("SMTP_APP_PASSWORD"):
    SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD", "").strip()

if SMTP_EMAIL and SMTP_APP_PASSWORD:
    print(f"📧 Email delivery ENABLED — sender: {SMTP_EMAIL}")
else:
    print("📧 Email delivery DISABLED — OTP codes will only show in console logs")

def send_otp_email(to_email: str, otp_code: str, username: str) -> bool:
    """Send OTP verification email via SMTP. Returns True on success."""
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        logger.warning("SMTP credentials not configured. Set SMTP_EMAIL and SMTP_APP_PASSWORD env vars.")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 VisionDetect AI — Your Password Reset Code: {otp_code}"
        msg["From"] = f"VisionDetect AI <{SMTP_EMAIL}>"
        msg["To"] = to_email
        
        # Plain text fallback
        text_body = f"""Hi {username},

Your password reset verification code is: {otp_code}

This code expires in 10 minutes. If you did not request this, please ignore this email.

— VisionDetect AI Team"""
        
        # Premium HTML email
        html_body = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🔐 VisionDetect AI</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Password Reset Verification</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hi <strong>{username}</strong>,</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">We received a request to reset your account password. Enter this verification code in the app to continue:</p>
          <!-- OTP Code Box -->
          <div style="text-align:center;margin:0 0 24px;">
            <div style="display:inline-block;background:#f8fafc;border:2px dashed #6366f1;border-radius:12px;padding:18px 40px;">
              <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#6366f1;font-family:'Courier New',monospace;">{otp_code}</span>
            </div>
          </div>
          <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center;">⏱ This code expires in <strong>10 minutes</strong></p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">© 2026 VisionDetect AI · YOLOv26 Object Detection Suite</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
        
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        
        # Send via SSL
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as server:
            server.set_debuglevel(1)  # Print SMTP debug to console
            logger.info(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")
            logger.info(f"Logging in as: {SMTP_EMAIL}")
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            logger.info("SMTP login successful!")
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        logger.info(f"✅ OTP email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP AUTH FAILED: Wrong email or App Password. Error: {e}")
        logger.error("💡 FIX: Go to https://myaccount.google.com/apppasswords and generate a NEW App Password")
        return False
    except smtplib.SMTPConnectError as e:
        logger.error(f"❌ SMTP CONNECTION FAILED: Cannot reach {SMTP_HOST}:{SMTP_PORT}. Error: {e}")
        logger.error("💡 FIX: Check your internet connection or firewall settings")
        return False
    except Exception as e:
        logger.error(f"❌ Failed to send OTP email to {to_email}: {type(e).__name__}: {e}")
        return False

# Global pointers
client = None
db = None
users_collection = None
detections_collection = None
use_fallback_db = False

# Fallback in-memory DBs in case MongoDB is not running locally
fallback_users = {}  # email -> user_doc
fallback_detections = []  # list of docs

# Password utilities (using secure PBKDF2-HMAC-SHA256 from standard library)
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, key_hex = hashed_password.split('$')
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

# Pydantic schemas for Auth
class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(...)
    phone: str = Field(default=None)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str = Field(...)
    password: str = Field(...)

class RequestOTP(BaseModel):
    email_or_phone: str = Field(...)

class UserResetPassword(BaseModel):
    email_or_phone: str = Field(...)
    otp_code: str = Field(...)
    new_password: str = Field(..., min_length=6)

API_KEY_NAME = "X-Developer-Token"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
DEV_TOKEN = os.getenv("DEV_TOKEN", "dev_secret_9832742938")

class TrainingConfig(BaseModel):
    dataset_yaml_url: str = Field(..., description="Secure URL pointing to the online dataset configuration (data.yaml)")
    epochs: int = Field(50, ge=1, le=100, description="Number of training epochs (max 100)")
    batch_size: int = Field(16, ge=1, le=32, description="Batch size (max 32)")
    learning_rate: float = Field(0.01, ge=0.0001, le=0.1, description="Learning rate (0.0001 - 0.1)")

    @field_validator('epochs')
    @classmethod
    def limit_epochs(cls, v: int) -> int:
        return min(max(v, 1), 100)

    @field_validator('batch_size')
    @classmethod
    def limit_batch_size(cls, v: int) -> int:
        return min(max(v, 1), 32)

    @field_validator('learning_rate')
    @classmethod
    def limit_lr(cls, v: float) -> float:
        return min(max(v, 0.0001), 0.1)

async def get_developer_token(api_key: str = Depends(api_key_header)):
    if not api_key:
        logger.warning("Access Denied: Missing developer token header.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Forbidden: Missing developer token header."
        )
    if api_key != DEV_TOKEN:
        masked_token = api_key[:4] + "***" if len(api_key) > 4 else "***"
        logger.warning(f"Access Denied: Invalid developer token '{masked_token}'.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Forbidden: Invalid developer token."
        )
    return api_key

# Global training lock state
IS_TRAINING_ACTIVE = False

def run_isolated_training(config: TrainingConfig, client_ip: str):
    global IS_TRAINING_ACTIVE
    logger.warning("==============================================================================")
    logger.warning(f"SYSTEM WARNING: YOLO TRAINING PIPELINE LAUNCHED BY DEV IP: {client_ip}")
    logger.warning(f"CONFIG: epochs={config.epochs}, batch={config.batch_size}, lr={config.learning_rate}")
    logger.warning("==============================================================================")

    try:
        training_workspace = os.path.join(os.getcwd(), "developer_training")
        os.makedirs(training_workspace, exist_ok=True)
        local_yaml_path = os.path.join(training_workspace, "downloaded_data.yaml")
        logger.info(f"Downloading dataset configuration to: {local_yaml_path}")
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(config.dataset_yaml_url, headers=headers)
        with urllib.request.urlopen(req) as response, open(local_yaml_path, 'wb') as out_file:
            out_file.write(response.read())
            
        logger.info(f"Dataset configuration saved successfully.")
        logger.info("Initializing YOLO26 model weights for training...")
        train_model = YOLO("yolo26n.pt")

        train_model.train(
            data=local_yaml_path,
            epochs=config.epochs,
            imgsz=640,
            batch=config.batch_size,
            lr0=config.learning_rate,
            project=os.path.join(training_workspace, "runs"),
            name="train_session",
            plots=True
        )
        logger.info("YOLO training pipeline finished successfully!")

    except Exception as e:
        logger.error(f"Error during training execution: {e}", exc_info=True)
    finally:
        IS_TRAINING_ACTIVE = False
        logger.info("Training lock released. System is IDLE.")


app = FastAPI()

@app.on_event("startup")
async def startup_db_client():
    global client, db, users_collection, detections_collection, use_fallback_db
    logger.info("Initializing database connection...")
    
    # Auto-start local MongoDB service on Windows if port 27017 is unresponsive
    if sys.platform == "win32":
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.0)
        result = sock.connect_ex(('127.0.0.1', 27017))
        sock.close()
        
        if result != 0:
            logger.info("Local MongoDB port 27017 is closed. Attempting to start service...")
            try:
                # Use cmd.exe /c net start MongoDB to start local database service
                subprocess.run(["cmd.exe", "/c", "net start MongoDB"], capture_output=True, text=True)
                logger.info("Issued local service startup command.")
            except Exception as e:
                logger.warning(f"Could not automatically trigger database service start: {e}")
                
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS, serverSelectionTimeoutMS=2500)
        await client.admin.command('ping')
        db = client.vision_detect
        users_collection = db.users
        detections_collection = db.detections
        logger.info("Successfully connected to MongoDB database 'vision_detect'!")
    except Exception as e:
        logger.warning(
            "==============================================================================\n"
            f"SYSTEM WARNING: MONGODB CONNECTION FAILED: {e}\n"
            "Falling back to high-fidelity in-memory database configuration.\n"
            "=============================================================================="
        )
        use_fallback_db = True

# Enable CORS so the React frontend can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLO26 model for high-efficiency edge-optimized detection
print("Loading YOLOv26 model...")
try:
    model = YOLO('yolo26n.pt') 
    print("Model loaded successfully!")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to load model: {e}")
    # We create a dummy model object to prevent the server from crashing on import
    # but detection will fail with the error message we added earlier.
    model = None

# In-memory store for detection history
detection_history = []
history_id_counter = 1

@app.get("/")
async def root():
    return {"status": "online", "model": "YOLOv26n"}

async def find_user_by_email_or_phone(email_or_phone: str):
    global fallback_users, users_collection, use_fallback_db
    val = email_or_phone.lower().strip()
    if use_fallback_db:
        for u in fallback_users.values():
            if u.get("email") == val or u.get("phone") == val:
                return u
        return None
    else:
        return await users_collection.find_one({
            "$or": [
                {"email": val},
                {"phone": val}
            ]
        })

# Global in-memory store for reset OTPs (expires in 10 mins)
otp_store = {}  # email_or_phone -> {"otp": str, "expires_at": datetime}

@app.post("/api/v1/auth/signup")
async def signup(user: UserSignup):
    global fallback_users, users_collection, use_fallback_db
    email_lower = user.email.lower().strip()
    phone_clean = user.phone.strip() if user.phone else None
    
    # 1. Check if user already exists by email or phone
    if use_fallback_db:
        if email_lower in fallback_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already registered."
            )
        if phone_clean:
            for u in fallback_users.values():
                if u.get("phone") == phone_clean:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="User with this phone number already registered."
                    )
    else:
        existing_user = await users_collection.find_one({"email": email_lower})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already registered."
            )
        if phone_clean:
            existing_phone = await users_collection.find_one({"phone": phone_clean})
            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this phone number already registered."
                )
            
    # 2. Hash password and save
    hashed = hash_password(user.password)
    user_doc = {
        "username": user.username.strip(),
        "email": email_lower,
        "phone": phone_clean,
        "password": hashed,
        "created_at": datetime.datetime.now().isoformat()
    }
    
    if use_fallback_db:
        fallback_users[email_lower] = user_doc
    else:
        await users_collection.insert_one(user_doc)
        
    logger.info(f"User registration success: {user.username} ({email_lower}, phone: {phone_clean})")
    return {
        "status": "success",
        "message": "Registration successful! You can now sign in.",
        "user": {
            "username": user.username.strip(),
            "email": email_lower,
            "phone": phone_clean
        }
    }

@app.post("/api/v1/auth/login")
async def login(credentials: UserLogin):
    email_or_phone = credentials.email.lower().strip()
    user_doc = await find_user_by_email_or_phone(email_or_phone)
        
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password."
        )
        
    # 2. Check password
    if not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password."
        )
        
    logger.info(f"User logged in successfully: {user_doc['username']} ({user_doc['email']})")
    return {
        "status": "success",
        "message": "Login successful!",
        "user": {
            "username": user_doc["username"],
            "email": user_doc["email"],
            "phone": user_doc.get("phone")
        }
    }

@app.post("/api/v1/auth/forgot-password-otp")
async def forgot_password_otp(req: RequestOTP):
    val = req.email_or_phone.lower().strip()
    
    # 1. Find user
    user_doc = await find_user_by_email_or_phone(val)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered account found with this email or phone number."
        )
        
    # 2. Generate 6-digit OTP code
    otp_code = str(secrets.randbelow(900000) + 100000)
    
    # Save OTP to memory store (expires in 10 minutes)
    otp_store[val] = {
        "otp": otp_code,
        "expires_at": datetime.datetime.now() + datetime.timedelta(minutes=10)
    }
    
    # 3. Attempt to send real email (skip if SMTP not configured)
    user_email = user_doc["email"]
    username = user_doc["username"]
    
    email_sent = False
    if SMTP_EMAIL and SMTP_APP_PASSWORD:
        # Use asyncio.to_thread (modern replacement for deprecated get_event_loop)
        email_sent = await asyncio.to_thread(
            send_otp_email, user_email, otp_code, username
        )
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to deliver OTP email. Please check your inbox or try again later."
            )
    
    # Always log to console (for admin visibility)
    logger.warning("==============================================================================")
    logger.warning(f"🔒 OTP CODE GENERATED FOR USER: {username} ({user_email})")
    logger.warning(f"🔥 ONE-TIME PASSWORD VERIFICATION CODE: {otp_code}")
    logger.warning("==============================================================================")
    
    if email_sent:
        return {
            "status": "success",
            "message": f"A 6-digit verification code has been sent to {user_email}. Please check your inbox!"
        }
    else:
        # SMTP not configured — return OTP in response for development/testing
        return {
            "status": "success",
            "message": "Your verification code is shown below (SMTP not configured).",
            "otp_code": otp_code
        }

@app.post("/api/v1/auth/reset-password")
async def reset_password(req: UserResetPassword):
    global fallback_users, users_collection, use_fallback_db
    val = req.email_or_phone.lower().strip()
    
    # 1. Verify user exists
    user_doc = await find_user_by_email_or_phone(val)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email or phone number."
        )
        
    # 2. Verify OTP
    stored = otp_store.get(val)
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found. Please request a new OTP."
        )
        
    if datetime.datetime.now() > stored["expires_at"]:
        del otp_store[val]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new OTP."
        )
        
    if req.otp_code.strip() != stored["otp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your console logs and try again."
        )
        
    # Correct OTP: Reset password
    hashed_pwd = hash_password(req.new_password)
    
    # Remove OTP once verified
    del otp_store[val]
    
    user_email = user_doc["email"]
    if use_fallback_db:
        fallback_users[user_email]["password"] = hashed_pwd
    else:
        await users_collection.update_one(
            {"email": user_email},
            {"$set": {"password": hashed_pwd}}
        )
        
    logger.info(f"Password reset success via OTP verification for: {user_email}")
    return {
        "status": "success",
        "message": "Password reset successful! You can now sign in with your new password."
    }

@app.post("/detect")
async def detect_objects(image: UploadFile = File(...), email: str = None):
    global history_id_counter, use_fallback_db, fallback_detections, detections_collection, detection_history
    
    # Read image
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        print(f"Image received: {image.filename}, size: {len(contents)} bytes")
    except Exception as e:
        print(f"Error reading image: {e}")
        return {"error": f"Failed to read image: {str(e)}", "objects": []}
    
    # Run YOLO26 inference
    try:
        if model is None:
            return {"error": "Model failed to load. Please check backend logs.", "objects": []}
            
        print("Running YOLO inference...")
        results = model(img, conf=0.25)[0]
        print(f"Inference complete. Found {len(results.boxes)} objects.")
    except Exception as e:
        print(f"Error during YOLO inference: {e}")
        return {"error": f"Inference failed: {str(e)}", "objects": []}
    
    detected_objects = []
    
    # Parse the results
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        w = x2 - x1
        h = y2 - y1
        
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        label = model.names[cls]
        
        detected_objects.append({
            "label": label,
            "confidence": conf,
            "box": [x1, y1, w, h]
        })
        
    # Record history
    history_entry = {
        "id": history_id_counter,
        "date": datetime.datetime.now().isoformat(),
        "objectCount": len(detected_objects),
        "objects": detected_objects,
        "imageUrl": None,
        "email": email.lower().strip() if email else None
    }
    history_id_counter += 1
    
    if email:
        if use_fallback_db:
            fallback_detections.insert(0, history_entry)
            if len(fallback_detections) > 40:
                fallback_detections.pop()
        else:
            await detections_collection.insert_one(history_entry)
    else:
        detection_history.insert(0, history_entry)
        if len(detection_history) > 20:
            detection_history.pop()

    return {"objects": detected_objects}

@app.get("/detections")
async def get_history(email: str = None):
    global fallback_detections, detections_collection, use_fallback_db, detection_history
    if email:
        email_clean = email.lower().strip()
        if use_fallback_db:
            user_history = [doc for doc in fallback_detections if doc.get("email") == email_clean]
            return {"history": user_history}
        else:
            try:
                cursor = detections_collection.find({"email": email_clean}).sort("date", -1).limit(20)
                user_history = []
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    user_history.append(doc)
                return {"history": user_history}
            except Exception as e:
                logger.error(f"Error querying detections from MongoDB: {e}")
                return {"history": []}
    else:
        return {"history": detection_history}

@app.post("/api/v1/developer/train")
async def trigger_developer_train(
    config: TrainingConfig,
    request: Request,
    background_tasks: BackgroundTasks,
    token: str = Depends(get_developer_token)
):
    global IS_TRAINING_ACTIVE
    client_ip = request.client.host if request.client else "unknown"
    masked_token = token[:4] + "***" if len(token) > 4 else "***"

    if IS_TRAINING_ACTIVE:
        logger.warning(f"Access Denied: Parallel training attempt rejected. IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="System busy: A training pipeline is already active."
        )

    # Acquire lock
    IS_TRAINING_ACTIVE = True

    # Audit log the attempt
    logger.info(
        f"TRAINING INITIATED - IP: {client_ip}, Masked Token: {masked_token}, "
        f"Epochs: {config.epochs}, Batch Size: {config.batch_size}, LR: {config.learning_rate}"
    )

    # Launch background task
    background_tasks.add_task(run_isolated_training, config, client_ip)

    return {
        "status": "Accepted",
        "message": "YOLO training pipeline successfully launched in the background.",
        "config": {
            "epochs": config.epochs,
            "batch_size": config.batch_size,
            "learning_rate": config.learning_rate
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
