import os
import uuid
import replicate
import httpx
from fastapi import FastAPI, HTTPException, Security, BackgroundTasks
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional

load_dotenv()

app = FastAPI(title="AI Image Generation API")

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase credentials are not set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

MEDIA_DIR = "media"
os.makedirs(MEDIA_DIR, exist_ok=True)


class GenerateRequest(BaseModel):
    prompt: str


def get_user_data(api_key: str) -> Optional[dict]:
    """Fetch user row from Supabase by API key. Returns None if not found."""
    try:
        resp = supabase.from_("users").select("*").eq("api_key", api_key).single().execute()
        return resp.data
    except Exception:
        return None


def save_user_data(api_key: str, user_data: dict):
    """Update user row in Supabase."""
    try:
        supabase.from_("users").update(user_data).eq("api_key", api_key).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user data: {str(e)}")


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    user = get_user_data(api_key)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key


def download_and_save_image(image_url: str, filename: str):
    filepath = os.path.join(MEDIA_DIR, filename)
    try:
        response = httpx.get(image_url, timeout=30)
        if response.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"Image saved to {filepath}")
        else:
            print(f"Failed to download image. Status: {response.status_code}")
    except Exception as e:
        print(f"Error downloading image: {str(e)}")


@app.post("/generate")
async def generate_image(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Security(verify_api_key),
):
    user = get_user_data(api_key)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid API key")
    if user["credits"] <= 0:
        raise HTTPException(status_code=402, detail="Not enough credits")

    try:
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={"prompt": request.prompt},
        )
        image_url = output[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    product_data = {
        "user_id": user["id"],
        "prompt": request.prompt,
        "image_url": image_url,
        "model_name": "stability-ai/sdxl",
        "status": "completed",
    }
    try:
        prod_resp = supabase.from_("products").insert(product_data).execute()
        product_id = prod_resp.data[0]["id"] if prod_resp.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store product: {str(e)}")

    user["credits"] -= 1
    save_user_data(api_key, user)

    filename = f"{uuid.uuid4()}.png"
    background_tasks.add_task(download_and_save_image, image_url, filename)

    return {
        "status": "success",
        "message": "Image generated and stored.",
        "image_url": image_url,
        "local_filename": filename,
        "product_id": product_id,
        "remaining_credits": user["credits"],
    }


@app.get("/me")
async def get_my_info(api_key: str = Security(verify_api_key)):
    user = get_user_data(api_key)
    return {
        "id": user["id"],
        "name": user["name"],
        "credits": user["credits"],
    }
