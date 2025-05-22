
// This is a server-side code.
'use server';

/**
 * @fileOverview Morphs an object from a foreground image into a background image.
 * The flow isolates the subject from the foreground image and then blends it
 * onto the background image. Text input is currently ignored.
 *
 * - morphObjectIntoBackground - A function that handles the image blending process.
 * - MorphObjectIntoBackgroundInput - The input type for the morphObjectIntoBackground function.
 * - MorphObjectIntoBackgroundOutput - The return type for the morphObjectIntoBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MorphObjectIntoBackgroundInputSchema = z.object({
  foregroundImage: z
    .string()
    .describe(
      "A foreground image with a subject (human or animal), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  backgroundImage: z
    .string()
    .describe(
      "A background image that will serve as the canvas, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  text: z.string().describe('The text to render. This input is currently ignored by the flow logic.'),
});
export type MorphObjectIntoBackgroundInput = z.infer<
  typeof MorphObjectIntoBackgroundInputSchema
>;

const MorphObjectIntoBackgroundOutputSchema = z.object({
  finalImage: z
    .string()
    .describe(
      'The final composite image, where the isolated subject from the foreground image is blended onto the background image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type MorphObjectIntoBackgroundOutput = z.infer<
  typeof MorphObjectIntoBackgroundOutputSchema
>;

export async function morphObjectIntoBackground(
  input: MorphObjectIntoBackgroundInput
): Promise<MorphObjectIntoBackgroundOutput> {
  return morphObjectIntoBackgroundFlow(input);
}

const morphObjectIntoBackgroundFlow = ai.defineFlow(
  {
    name: 'morphObjectIntoBackgroundFlow',
    inputSchema: MorphObjectIntoBackgroundInputSchema,
    outputSchema: MorphObjectIntoBackgroundOutputSchema,
  },
  async (input: MorphObjectIntoBackgroundInput): Promise<MorphObjectIntoBackgroundOutput> => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: input.foregroundImage}}, // Image 1: Foreground with subject
        {media: {url: input.backgroundImage}}, // Image 2: Background canvas
        {
          text: `You are an expert image editing AI.
The user has provided two images:
1.  **Foreground Image** (the first image provided): This image contains the primary subject(s) (e.g., a person, animal) that need to be isolated.
2.  **Background Image** (the second image provided): This image will serve as the new canvas or background for the final result.

Your task is to perform the following steps precisely:
1.  From the **Foreground Image**, identify and isolate the primary human or animal subject(s) **in their entirety**. Ensure the complete subject is captured without any cropping or missing parts.
2.  REMOVE THE ORIGINAL BACKGROUND from the **Foreground Image** completely, leaving only the isolated subject(s). The area where the background was removed should ideally be transparent to allow for seamless blending.
3.  Take the isolated subject(s) (with transparent background) from step 2.
4.  Place and blend these isolated subject(s) naturally onto the **Background Image**. The **Background Image** should act as the primary canvas and remain largely intact, with the subjects from the Foreground Image integrated into it.
5.  Return the final composite image as a single image data URI. Do not output any descriptive text or any other content apart from the image data URI.`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      console.error('Image generation failed: media.url is missing from AI response in morphObjectIntoBackgroundFlow.');
      throw new Error('AI failed to produce an image. The media URL was not available in the response.');
    }
    
    return {finalImage: media.url};
  }
);
