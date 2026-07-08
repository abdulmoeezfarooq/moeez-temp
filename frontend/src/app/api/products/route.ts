import { NextResponse } from 'next/server';

export async function GET() {
  // Hardcoded list of 3 sample AI generated products/images
  const products = [
    {
      id: 1,
      title: "Futuristic Cyberpunk City",
      prompt: "A futuristic cyberpunk city at night with neon signs, flying cars, highly detailed, 8k resolution",
      imageUrl: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=800&auto=format&fit=crop",
      price: 0.99
    },
    {
      id: 2,
      title: "Fantasy Forest Landscape",
      prompt: "A magical fantasy forest with glowing mushrooms, ancient trees, misty atmosphere, digital art",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
      price: 1.49
    },
    {
      id: 3,
      title: "Abstract Geometric Portrait",
      prompt: "Abstract geometric portrait of a woman, vibrant colors, cubism style, vector art",
      imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
      price: 2.99
    }
  ];

  // Return the JSON response
  return NextResponse.json(
    { 
      success: true, 
      message: "Products retrieved successfully", 
      data: products 
    },
    { status: 200 }
  );
}
