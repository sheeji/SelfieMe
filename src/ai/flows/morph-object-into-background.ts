
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
        {media: {url: input.foregroundImage}}, // This will be referred to as the "Foreground Image" or "first image" in the text prompt
        {media: {url: input.backgroundImage}}, // This will be referred to as the "Background Image" or "second image" in the text prompt
        {
          text: `You are an expert image manipulation AI.
The user has provided a foreground image, a background image, and some text.

- The **Foreground Image** (the first image provided in the input) contains the primary subject (e.g., a person or animal).
- The **Background Image** (the second image provided in the input) is the scene or texture that should serve as the base.
- The **Text to add** is: "${input.text}".

Your task is to:
1. Identify the main object(s) in the **Foreground Image** (the first image).
2. Use the **Background Image** (the second image) as the primary canvas or base for the final image.
3. Seamlessly morph and blend the identified object(s) from the **Foreground Image** INTO the **Background Image**. The Background Image should remain clearly identifiable and form the dominant backdrop of the final composite.
4. Render the provided text ("${input.text}") as a hand-sketched element onto this newly composed image (i.e., the Foreground object integrated into the Background Image). The style of the sketch should be artistic and visually appealing, fitting the theme of the combined image.
5. Return ONLY the final, merged image. This image must be a single data URI.

Focus on creating a high-quality, plausible, and aesthetically pleasing result. The object from the Foreground Image should appear naturally integrated into the Background Image.
Do not output any text description, only the image data URI of the final composed image.`,
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

