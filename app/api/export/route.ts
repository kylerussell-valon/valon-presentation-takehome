import { NextResponse } from "next/server";
import pptxgen from "pptxgenjs";

type SlidePayload = {
  name: string;
  prompt: string;
  note?: string;
  imageData?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      slides?: SlidePayload[];
    };

    if (!body.slides?.length) {
      return NextResponse.json({ error: "No slides to export." }, { status: 400 });
    }

    const deck = new pptxgen();
    deck.layout = "LAYOUT_WIDE";
    deck.author = "Valon";
    deck.company = "Valon";
    deck.subject = "Valon Presentation Takehome export";
    deck.title = body.title || "Valon Presentation Takehome export";

    for (const slideData of body.slides) {
      const slide = deck.addSlide();
      slide.background = { color: "F4E7B8" };

      if (slideData.imageData) {
        slide.addImage({
          data: slideData.imageData,
          x: 0,
          y: 0,
          w: 13.333,
          h: 7.5
        });
      } else {
        slide.addShape("rect", {
          x: 0.7,
          y: 1.1,
          w: 11.9,
          h: 4.9,
          fill: { color: "FFF7DC" },
          line: { color: "2B1E16", width: 1.5 }
        });
        slide.addText("No image on this slide yet.", {
          x: 1.2,
          y: 3.1,
          w: 7.5,
          h: 0.5,
          fontFace: "Aptos",
          fontSize: 24,
          bold: true,
          color: "2B1E16"
        });
      }

      slide.addText(slideData.name || "Untitled slide", {
        x: 0.4,
        y: 0.25,
        w: 7.6,
        h: 0.4,
        fontFace: "Aptos Display",
        fontSize: 18,
        bold: true,
        color: "141414",
        margin: 0
      });

      slide.addText(slideData.prompt || "", {
        x: 0.4,
        y: 6.95,
        w: 8.3,
        h: 0.3,
        fontFace: "Aptos",
        fontSize: 8,
        color: "141414",
        margin: 0
      });

      slide.addText(slideData.note || "", {
        x: 8.95,
        y: 6.8,
        w: 4,
        h: 0.45,
        fontFace: "Aptos",
        fontSize: 8,
        color: "2B1E16",
        margin: 0,
        align: "right"
      });
    }

    const file = await deck.write({ outputType: "nodebuffer" });

    let responseBody: BodyInit;

    if (typeof file === "string" || file instanceof Blob || file instanceof ArrayBuffer) {
      responseBody = file;
    } else {
      const arrayBuffer = new ArrayBuffer(file.byteLength);
      new Uint8Array(arrayBuffer).set(file);
      responseBody = arrayBuffer;
    }

    return new Response(responseBody, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="valon-presentation-takehome-export.pptx"'
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while exporting.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
