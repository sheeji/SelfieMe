
// This is a server-side code.
'use server';

/**
 * @fileOverview Morphs an object from a foreground image into a background image and adds sketched text.
 *
 * - morphObjectIntoBackground - A function that morphs a foreground object into a background image and adds text.
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
      "A background image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  text: z.string().describe('The text to render as hand-sketched on the image.'),
});
export type MorphObjectIntoBackgroundInput = z.infer<
  typeof MorphObjectIntoBackgroundInputSchema
>;

const MorphObjectIntoBackgroundOutputSchema = z.object({
  finalImage: z
    .string()
    .describe(
      'The final merged image with the morphed object and hand-sketched text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
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
      model: 'googleai/gemini-2.0-flash-exp', // Use the experimental model capable of image generation
      prompt: [
        {media: {url: input.foregroundImage}}, // First image (foreground)
        {media: {url: input.backgroundImage}}, // Second image (background)
        {
          text: `You are an expert image manipulation AI.
The user has provided two images and some text.
The first image is a foreground image containing an object (e.g., a person or animal).
The second image is a background image (e.g., a landscape or texture).
The text to add is: "${input.text}".

Your task is to:
1. Identify the main object(s) in the first (foreground) image.
2. Seamlessly morph and blend this object(s) into the second (background) image.
3. Render the provided text ("${input.text}") as a hand-sketched element onto the composed image. The style of the sketch should be artistic and visually appealing, fitting the theme of the combined image.
4. Return only the final, merged image. This image should be a single data URI.

Focus on creating a high-quality, plausible, and aesthetically pleasing result. The foreground object should appear naturally integrated into the background, and the sketched text should complement the overall image composition.
Do not output any text description, only the image data URI.`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Request both modalities, primarily interested in IMAGE
      },
    });

    if (!media?.url) {
      console.error('Image generation failed: media.url is missing from AI response in morphObjectIntoBackgroundFlow.');
      throw new Error('AI failed to produce an image. The media URL was not available in the response.');
    }
    
    return {finalImage: media.url};
  }
);
