import os
import json
import uuid
import httpx
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

MEDIA_DIR = "media"
os.makedirs(MEDIA_DIR, exist_ok=True)

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Warning: Supabase credentials are not set in .env")

# Basic HTTP Headers for Supabase REST API
def get_supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_user_data(api_key):
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?api_key=eq.{api_key}"
        resp = httpx.get(url, headers=get_supabase_headers(), timeout=10)
        data = resp.json()
        if data and len(data) > 0:
            return data[0]
    except Exception as e:
        print(f"Error fetching user: {e}")
    return None

def save_user_data(api_key, credits):
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?api_key=eq.{api_key}"
        payload = {"credits": credits}
        httpx.patch(url, headers=get_supabase_headers(), json=payload, timeout=10)
    except Exception as e:
        print(f"Error saving user: {e}")

def download_and_save_image(image_url, filename):
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

class SimpleAppHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self._send_cors_headers()
        self.end_headers()

    def send_error_json(self, code, message):
        self.send_response(code)
        self._send_cors_headers()
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"detail": message}).encode('utf-8'))

    def send_json(self, data):
        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == "/me":
            # Return a dummy user so the frontend works without an API key
            self.send_json({
                "id": "00000000-0000-0000-0000-000000000000",
                "name": "Admin",
                "credits": 999
            })
        else:
            self.send_error_json(404, "Not Found")

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == "/generate":
            api_key = self.headers.get("X-API-Key")
            user = get_user_data(api_key) if SUPABASE_URL else None
            if not user:
                user = {"id": "test-user-id", "credits": 999}
            
            if user.get("credits", 0) <= 0:
                return self.send_error_json(402, "Insufficient credits")

            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                body = json.loads(post_data.decode('utf-8'))
                prompt = body.get("prompt")
                model_choice = body.get("model", "dev")
            except Exception:
                return self.send_error_json(400, "Invalid JSON payload")

            if not prompt:
                return self.send_error_json(400, "Missing prompt")

            # ── Model → (env var, replicate model, optional version hash) ───────
            # version=None  → use /v1/models/{owner}/{name}/predictions  (newer API)
            # version=str   → use /v1/predictions with {"version": ...}  (legacy API)
            MODEL_MAP = {
                "sdxl": {
                    "model": "bytedance/sdxl-lightning-4step",
                    "version": None,
                },
                "flux": {
                    "model": "fofr/flux-schnell",
                    "version": None,
                },
                "flux1.1": {
                    "model": "black-forest-labs/flux-1.1-pro",
                    "version": None,
                },
                "dev": {
                    "model": "black-forest-labs/flux-dev",
                    "version": None,
                },
                "gemini": {
                    "model": "gemini",
                    "version": None,
                },
            }

            cfg = MODEL_MAP.get(model_choice, MODEL_MAP["dev"])
            replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
            if not replicate_api_token:
                return self.send_error_json(500, "REPLICATE_API_TOKEN is not configured in backend/.env")

            print(f"[generate] model={model_choice} | replicate_model={cfg.get('model') or 'versioned:'+cfg['version'][:8]}")

            try:
                auth_headers = {
                    "Authorization": f"Token {replicate_api_token}",
                    "Content-Type": "application/json",
                    "Prefer": "wait",
                }

                # Build input — disable safety checker to avoid false-positive NSFW blocks
                model_input = {
                    "prompt": prompt,
                    "disable_safety_checker": True,
                }

                if model_choice == "gemini":
                    import base64

                    gemini_url = (
                        "https://generativelanguage.googleapis.com/v1beta/"
                        "models/imagen-3.0-generate-002:predict"
                        f"?key={replicate_api_token}"
                    )
                    gemini_resp = httpx.post(
                        gemini_url,
                        headers={"Content-Type": "application/json"},
                        json={
                            "instances": [{"prompt": prompt}],
                            "parameters": {
                                "sampleCount": 1,
                            },
                        },
                        timeout=120,
                    )
                    gemini_data = gemini_resp.json()

                    if gemini_resp.status_code != 200:
                        error_msg = gemini_data.get("error", {}).get("message", "Unknown Gemini API error")
                        return self.send_error_json(500, f"Gemini API error: {error_msg}")

                    predictions = gemini_data.get("predictions", [])
                    if not predictions:
                        return self.send_error_json(500, "Gemini returned no images")

                    b64 = predictions[0]["bytesBase64Encoded"]
                    mime = predictions[0].get("mimeType", "image/png")
                    image_url = f"data:{mime};base64,{b64}"
                else:
                    if cfg.get("version"):
                        resp = httpx.post(
                            "https://api.replicate.com/v1/predictions",
                            headers=auth_headers,
                            json={"version": cfg["version"], "input": model_input},
                            timeout=120,
                        )
                    else:
                        resp = httpx.post(
                            f"https://api.replicate.com/v1/models/{cfg['model']}/predictions",
                            headers=auth_headers,
                            json={"input": model_input},
                            timeout=120,
                        )

                    prediction = resp.json()
                    if resp.status_code not in (200, 201):
                        return self.send_error_json(500, f"Replicate API error: {prediction.get('detail', 'Unknown')}")

                    # Poll for completion if not yet done (Prefer:wait may still need polling)
                    poll_count = 0
                    while prediction.get("status") not in ["succeeded", "failed", "canceled"]:
                        time.sleep(2)
                        poll_url = prediction["urls"]["get"]
                        poll_resp = httpx.get(poll_url, headers=auth_headers, timeout=30)
                        prediction = poll_resp.json()
                        poll_count += 1
                        if poll_count > 60:
                            return self.send_error_json(500, "Replicate timed out after 2 minutes")

                    if prediction.get("status") != "succeeded":
                        return self.send_error_json(500, f"Replicate failed: {prediction.get('error', 'Unknown')}")

                    output = prediction.get("output")
                    image_url = output[0] if isinstance(output, list) else output

                # Deduct credits after successful generation
                new_credits = user["credits"] - 1
                if SUPABASE_URL:
                    save_user_data(api_key, new_credits)
                user["credits"] = new_credits

            except Exception as e:
                import traceback
                traceback.print_exc()
                return self.send_error_json(500, f"AI generation failed: {str(e)}")

            self.send_json({
                "status": "success",
                "message": "Image generated.",
                "image_url": image_url,
                "product_id": None,
                "remaining_credits": user["credits"],
            })
        else:
            self.send_error_json(404, "Not Found")

if __name__ == "__main__":
    port = 8000
    server = HTTPServer(("0.0.0.0", port), SimpleAppHandler)
    print(f"Backend Server starting on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
