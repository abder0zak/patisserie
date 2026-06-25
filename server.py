import os
import sys
from fastapi import FastAPI, HTTPException, Header,Request
from fastapi.responses import FileResponse ,HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import time
import random
import sqlite3
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles

app = FastAPI()
DB_FILE = "pastries.db"
template = Jinja2Templates(directory="templates")
# 1. HANDL SAFE FOR 
# Vercel's runtime environment is read-only except for /tmp
if "vercel" in sys.modules or os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
    DB_FILE = "/tmp/pastries.db"
else:
    UPLOAD_DIR = "templates/uploads"
    DB_FILE = "pastries.db"

UPLOAD_DIR = os.path.join("templates", "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)




@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    context = {"request": request}
    return template.TemplateResponse(request, name="index.html", context=context)
    
    return {"error": "index.html not found in public folder"}

@app.get("/admin.html", response_class=HTMLResponse)
async def read_admin(request: Request):
    context = {"request": request}
    return template.TemplateResponse(request, name="admin.html", context=context)

    return {"error": "admin.html not found in public folder"}



# 5. LOCAL RUNNER CONFIGURATION
if __name__ == "__main__":
    import uvicorn
    # Hardcoded port example, change to your variable if needed
    uvicorn.run("server:app", host="localhost", port=8000, reload=True)
print(f"Server is running at http://localhost:8000")
print(f"the curent working directory is {os.getcwd()}")
