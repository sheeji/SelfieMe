
// This is a server-side code.
'use server';

/**
 * @fileOverview Morphs an object from a foreground image into a background image and adds sketched text.
 * Currently modified to ONLY isolate the subject from the foreground image.
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
      "A background image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This input is currently ignored by the flow logic."
    ),
  text: z.string().describe('The text to render as hand-sketched on the image. This input is currently ignored by the flow logic.'),
});
export type MorphObjectIntoBackgroundInput = z.infer<
  typeof MorphObjectIntoBackgroundInputSchema
>;

const MorphObjectIntoBackgroundOutputSchema = z.object({
  finalImage: z
    .string()
    .describe(
      'The final image, which is the isolated subject from the foreground image with its background removed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
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
        {media: {url: input.foregroundImage}}, // The image to process
        {
          text: `You are an expert image editing AI.
The user has provided an image.
- The image provided in the input is the **Foreground Image**. It contains the primary subject (e.g., a person or animal) and its original background.

Your task is to perform the following steps precisely:
1.  From the **Foreground Image**, accurately isolate the primary human or animal subject.
2.  REMOVE ITS ORIGINAL BACKGROUND COMPLETELY. The area where the background was should ideally be transparent. If transparency is not possible, use a solid white background. The key is a clean cutout of the subject.
3.  Return ONLY the isolated subject as a single image data URI. Do not output any descriptive text or any other content apart from the image data URI.`,
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
