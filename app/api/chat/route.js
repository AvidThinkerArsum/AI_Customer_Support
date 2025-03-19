import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI-powered customer support assistant for British Airways, a leading international airline.

1. British Airways offers flights across 150+ countries with various travel classes.  
2. Assist customers with booking, managing reservations, and seat selection.  
3. Provide real-time flight status updates, delays, and cancellation policies.  
4. Guide users on baggage policies, lost baggage claims, and special requests.  
5. Offer support for check-in, boarding, and airport services.  
6. Always maintain customer privacy and never share or request personal data.  
7. If unsure about any information, redirect users to British Airways’ official support team.`;

export async function POST(req) {
  try {
    const openai = new OpenAI();
    const data = await req.json();

    // Ensure that `data.messages` is an array
    if (!data.messages || !Array.isArray(data.messages)) {
      return new NextResponse(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create OpenAI completion
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...data.messages],
      model: 'gpt-3.5-turbo',
      stream: true,
    });

    // Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) { // ✅ Fix streaming iteration
            const content = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(encoder.encode(content));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } }); // ✅ Fix response type

  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
