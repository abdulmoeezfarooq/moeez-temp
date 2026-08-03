import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON payload" }, { status: 400 });
  }

  const { prompt } = body;

  if (!prompt) {
    return NextResponse.json({ detail: "Missing prompt" }, { status: 400 });
  }

  try {
    const promptEncoded = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?nologo=true&model=flux&width=1024&height=1024&enhance=true`;

    const pollinationsResp = await fetch(pollinationsUrl);

    if (!pollinationsResp.ok) {
      return NextResponse.json(
        { detail: `Pollinations API error: ${pollinationsResp.statusText}` },
        { status: pollinationsResp.status }
      );
    }

    const arrayBuffer = await pollinationsResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const b64 = buffer.toString("base64");
    const mime = pollinationsResp.headers.get("content-type") ?? "image/jpeg";
    const imageUrl = `data:${mime};base64,${b64}`;

    return NextResponse.json({
      status: "success",
      message: "Image generated.",
      image_url: imageUrl,
      product_id: null,
      remaining_credits: 998,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { detail: `AI generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
