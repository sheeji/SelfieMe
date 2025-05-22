// src/app/actions.ts
"use server";

import { morphObjectIntoBackground, type MorphObjectIntoBackgroundInput } from "@/ai/flows/morph-object-into-background";

interface WeaveResult {
  finalImage?: string;
  error?: string;
}

export async function weaveImagesAction(input: MorphObjectIntoBackgroundInput): Promise<WeaveResult> {
  // Basic validation on server side
  if (!input.foregroundImage || !input.foregroundImage.startsWith('data:image')) {
    return { error: "Foreground image is missing or invalid." };
  }
  if (!input.backgroundImage || !input.backgroundImage.startsWith('data:image')) {
    return { error: "Background image is missing or invalid." };
  }
  if (typeof input.text !== 'string') { // Allow empty string for text
    return { error: "Text input is invalid." };
  }

  try {
    console.log("Starting morphObjectIntoBackground flow with input text:", input.text);
    const result = await morphObjectIntoBackground(input);
    if (!result.finalImage || !result.finalImage.startsWith('data:image')) {
        console.error("AI flow returned invalid final image data URI", result.finalImage?.substring(0, 100));
        return { error: "The AI failed to produce a valid image. Please try again." };
    }
    console.log("morphObjectIntoBackground flow completed successfully.");
    return { finalImage: result.finalImage };
  } catch (error) {
    console.error("Error in weaveImagesAction:", error);
    let errorMessage = "An unexpected error occurred while weaving images.";
    if (error instanceof Error) {
        // Limit the length of the error message sent to client
        errorMessage = `Failed to weave images: ${error.message.substring(0, 150)}${error.message.length > 150 ? '...' : ''}`;
    }
    return { error: errorMessage };
  }
}
