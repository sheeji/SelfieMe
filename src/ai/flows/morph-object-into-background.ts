
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
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: [
        {media: {url: input.foregroundImage}}, 
        {media: {url: input.backgroundImage}}, 
        {
          text: `You are an expert image manipulation AI.
The user has provided two images and some text.
- The **FIRST image** provided in the input is the **Foreground Image**. It contains the primary subject (e.g., a person or animal) and its original background.
- The **SECOND image** provided in the input is the **Background Image**. This is the scene or texture that MUST serve as the largely unchanged base for the final composition.
- The **Text to add** is: "${input.text}".

Your task is to perform the following steps precisely:
1.  From the **Foreground Image** (the FIRST image), accurately isolate the primary human or animal subject, REMOVING ITS ORIGINAL BACKGROUND COMPLETELY. Only the subject itself should be retained.
2.  Take the **Background Image** (the SECOND image) and use it as the foundational layer. This Background Image should remain clearly recognizable and form the dominant backdrop in the final output. It should NOT be significantly altered or morphed by the foreground content.
3.  Place and seamlessly integrate the isolated subject (from step 1) ONTO the Background Image. The integration should make the subject appear naturally part of the background scene.
4.  After the subject is placed on the Background Image, render the provided text ("${input.text}") as a hand-sketched element onto this composite image. The style of the sketch should be artistic and visually appealing.
5.  Return ONLY the final, composed image as a single data URI. Do not output any descriptive text or any other content apart from the image data URI.`,
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
