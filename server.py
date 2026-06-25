import os
import sys
from fastapi import FastAPI,Request
from fastapi.responses import FileResponse ,HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

template = Jinja2Templates(directory="templates")
# 1. HANDLE DIRECTORIES SAFE FOR VERCEL
# Vercel's runtime environment is read-only except for /tmp
if "vercel" in sys.modules or os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
    DB_FILE = "/tmp/pastries.db"
else:
    UPLOAD_DIR = "public/uploads"
    DB_FILE = "pastries.db"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# 2. YOUR API ENDPOINTS GO HERE (Example placeholder)
@app.get("/api/pastries")
def get_pastries():
    return {"message": "Database is connected!", "file": DB_FILE}


# 3. EXPLICIT FRONTEND ROUTING (Fixes the 404 Error)
# This forces the Python server to read your HTML pages directly from disk

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    context = {"request": request}
    return template.TemplateResponse(request,name="index.html", context=context)
    
    return {"error": "index.html not found in public folder"}

@app.get("/admin.html", response_class=HTMLResponse)
async def read_admin(request: Request):
    context = {"request": request}
    return template.TemplateResponse(request,name="admin.html", context=context)

    return {"error": "admin.html not found in public folder"}

# 5. LOCAL RUNNER CONFIGURATION
if __name__ == "__main__":
    import uvicorn
    # Hardcoded port example, change to your variable if needed
    uvicorn.run("server:app", host="localhost", port=8000, reload=True)
print(f"Server is running at http://localhost:8000")
print(f"the curent working directory is {os.getcwd()}")
