import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gemini-3-pro-image-preview";
const HOUSE_STYLE_APPENDIX = `
Create the image like an overconfident bad presentation designer made it.
Always include large visible slide text inside the image itself.
Render that text in an obvious Comic Sans or Comic Sans-like playful font.
Use cheesy business-presentation energy, bright primary colors, clashing accents, and slightly awkward composition.
Prefer corny iconography, stock-art vibes, and unnecessary decorative shapes.
Do not make it subtle, elegant, or restrained.
`.trim();

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_API_KEY in your local environment." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const effectivePrompt = `${prompt}\n\n${HOUSE_STYLE_APPENDIX}`;

    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: process.env.GOOGLE_IMAGE_MODEL || DEFAULT_MODEL,
      contents: effectivePrompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    });

    const parts = (response.candidates ?? []).flatMap(
      (candidate) => candidate.content?.parts ?? []
    );
    const imagePart = parts.find((part) => part.inlineData?.data);
    const text = parts
      .filter((part) => typeof part.text === "string")
      .map((part) => part.text?.trim())
      .filter(Boolean)
      .join("\n");

    if (!imagePart?.inlineData?.data || !imagePart.inlineData.mimeType) {
      return NextResponse.json(
        {
          error:
            text || "The model answered, but it did not send an image back."
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageData: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      text
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while generating.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
