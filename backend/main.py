import os
import json
import uuid
import replicate
import httpx
from fastapi import FastAPI, HTTPException, Security, BackgroundTasks
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Beginner Friendly AI Image API")

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

DB_FILE = "database.json"
MEDIA_DIR = "media"

# Ensure media directory exists
os.makedirs(MEDIA_DIR, exist_ok=True)

class GenerateRequest(BaseModel):
    prompt: str

def get_user_data(api_key: str):
    """Read the database.json file to find the user by their API key."""
    if not os.path.exists(DB_FILE):
        return None
        
    with open(DB_FILE, "r") as f:
        data = json.load(f)
        
    users = data.get("users", {})
    return users.get(api_key)

def save_user_data(api_key: str, user_data: dict):
    """Save updated user data back to the database.json file."""
    with open(DB_FILE, "r") as f:
        data = json.load(f)
        
    data["users"][api_key] = user_data
    
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

async def verify_api_key(api_key: str = Security(api_key_header)):
    """Check if the provided API key is in our database."""
    user = get_user_data(api_key)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

def download_and_save_image(image_url: str, filename: str):
    """Download the image from the Replicate URL and save it locally."""
    # This runs in the background so the user doesn't have to wait for the download
    filepath = os.path.join(MEDIA_DIR, filename)
    
    # We use httpx (a modern alternative to requests) to download the file
    response = httpx.get(image_url)
    if response.status_code == 200:
        with open(filepath, "wb") as f:
            f.write(response.content)
        print(f"Image saved to {filepath}")
    else:
        print(f"Failed to download image. Status code: {response.status_code}")

@app.post("/generate")
async def generate_image(
    request: GenerateRequest, 
    background_tasks: BackgroundTasks,
    api_key: str = Security(verify_api_key)
):
    """Endpoint to generate an image from a text prompt."""
    
    # 1. Check if user has credits
    user = get_user_data(api_key)
    if user["credits"] <= 0:
        raise HTTPException(status_code=402, detail="Not enough credits")
        
    # 2. Call Replicate AI to generate the image
    # Note: We are using a popular open-source model here (Stable Diffusion XL)
    try:
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={"prompt": request.prompt}
        )
        # Replicate returns a list of URLs, we just take the first one
        image_url = output[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # 3. Deduct a credit
    user["credits"] -= 1
    save_user_data(api_key, user)
    
    # 4. Save the image to our local folder in the background
    # We generate a unique filename for the image
    filename = f"{uuid.uuid4()}.png"
    background_tasks.add_task(download_and_save_image, image_url, filename)
    
    # 5. Return success to the user immediately
    return {
        "status": "success",
        "message": "Image generated and will be saved shortly.",
        "image_url": image_url,
        "local_filename": filename,
        "remaining_credits": user["credits"]
    }

@app.get("/me")
async def get_my_info(api_key: str = Security(verify_api_key)):
    """Endpoint to check remaining credits."""
    user = get_user_data(api_key)
    return {
        "name": user["name"],
        "credits": user["credits"]
    }
