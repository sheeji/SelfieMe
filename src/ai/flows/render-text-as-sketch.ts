// src/ai/flows/render-text-as-sketch.ts
'use server';
/**
 * @fileOverview Renders input text as a hand-sketched element on an image using generative AI.
 *
 * - renderTextAsSketch - A function that handles the text rendering process.
 * - RenderTextAsSketchInput - The input type for the renderTextAsSketch function.
 * - RenderTextAsSketchOutput - The return type for the renderTextAsSketch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RenderTextAsSketchInputSchema = z.object({
  text: z.string().describe('The text to render as a hand sketch.'),
  backgroundImageDataUri: z
    .string()
    .describe(
      "The background image to render the text on, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RenderTextAsSketchInput = z.infer<typeof RenderTextAsSketchInputSchema>;

const RenderTextAsSketchOutputSchema = z.object({
  sketchImageDataUri: z
    .string()
    .describe(
      'The image data URI of the background image with the text rendered as a hand sketch.'
    ),
});
export type RenderTextAsSketchOutput = z.infer<typeof RenderTextAsSketchOutputSchema>;

export async function renderTextAsSketch(input: RenderTextAsSketchInput): Promise<RenderTextAsSketchOutput> {
  return renderTextAsSketchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'renderTextAsSketchPrompt',
  input: {schema: RenderTextAsSketchInputSchema},
  output: {schema: RenderTextAsSketchOutputSchema},
  prompt: `You are an AI that specializes in rendering text as hand-drawn sketches on images.

  The user will provide a background image and text.  Your task is to render the text as if it were hand-sketched onto the image.

  Here is the background image:
  {{media url=backgroundImageDataUri}}

  Here is the text to render:
  {{text}}

  Return the final image with the hand-sketched text.
  `, // VERY IMPORTANT: ALWAYS include the media url for the image
});

const renderTextAsSketchFlow = ai.defineFlow(
  {
    name: 'renderTextAsSketchFlow',
    inputSchema: RenderTextAsSketchInputSchema,
    outputSchema: RenderTextAsSketchOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.backgroundImageDataUri}},
        {text: `render the text '${input.text}' as a hand sketch on this image`},
      ],
      model: 'googleai/gemini-2.0-flash-exp',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {sketchImageDataUri: media.url!};
  }
);
