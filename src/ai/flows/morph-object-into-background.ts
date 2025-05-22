
// This is a server-side code.
'use server';

/**
 * @fileOverview Isolates a subject from a foreground image, sketches text onto a
 * background image, and then blends the isolated subject onto the text-sketched background.
 *
 * - morphObjectIntoBackground - A function that handles the combined image processing.
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
  text: z.string().describe('The text to be hand-sketched onto the background image before blending the foreground subject.'),
});
export type MorphObjectIntoBackgroundInput = z.infer<
  typeof MorphObjectIntoBackgroundInputSchema
>;

const MorphObjectIntoBackgroundOutputSchema = z.object({
  finalImage: z
    .string()
    .describe(
      'The final composite image, where the isolated subject from the foreground image is blended onto the background image (which has the input text sketched on it), as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
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
The user has provided two images and a text string:
1.  **Foreground Image** (the first image provided): This image contains the primary subject(s) (e.g., a person, animal) that need to be isolated.
2.  **Background Image** (the second image provided): This image will serve as the canvas for text sketching and the final composition.
3.  **Text Input**: The text string "${input.text}" needs to be rendered.

Your task is to perform the following steps in order:
1.  On the **Background Image**, render the provided **Text Input** ("${input.text}") as if it were naturally hand-sketched onto the scene.
2.  From the **Foreground Image**, identify and accurately isolate the primary human or animal subject(s) **in their entirety**. Ensure the complete subject is captured without any cropping or missing parts. Remove the original background from this **Foreground Image** completely, leaving only the isolated subject(s). The area where the background was removed should ideally be transparent.
3.  Take the isolated subject(s) (with transparent or neutral background) from step 2.
4.  Place and seamlessly blend these isolated subject(s) onto the **Background Image** that now includes the hand-sketched text (from step 1). The text-sketched Background Image should act as the final canvas.
5.  Return the final composite image as a single image data URI. Ensure this image contains the background with sketched text, and the isolated foreground subject blended on top. Do not output any descriptive text or any other content apart from the image data URI.`,
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
