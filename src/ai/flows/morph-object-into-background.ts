// This is a server-side code.
'use server';

/**
 * @fileOverview Morphs an object from a foreground image into a background image.
 *
 * - morphObjectIntoBackground - A function that morphs a foreground object into a background image.
 * - MorphObjectIntoBackgroundInput - The input type for the morphObjectIntoBackground function.
 * - MorphObjectIntoBackgroundOutput - The return type for the morphObjectIntoBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MorphObjectIntoBackgroundInputSchema = z.object({
  foregroundImage: z
    .string()
    .describe(
      'A foreground image with a subject (human or animal), as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // as a data URI
    ),
  backgroundImage: z
    .string()
    .describe(
      'A background image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // as a data URI
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
      'The final merged image with the morphed object and hand-sketched text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // as a data URI
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

const morphObjectIntoBackgroundPrompt = ai.definePrompt({
  name: 'morphObjectIntoBackgroundPrompt',
  input: {schema: MorphObjectIntoBackgroundInputSchema},
  output: {schema: MorphObjectIntoBackgroundOutputSchema},
  prompt: `Here are two images, the first of which contains the objects to be morphed into the second.

First Image: {{media url=foregroundImage}}
Second Image: {{media url=backgroundImage}}

Morph the object(s) from the first image into the second image, and add the following text to the image as a hand-sketched element: {{{text}}}. Return the final merged image.

Ensure the finalImage output is a data URI.
`,
});

const morphObjectIntoBackgroundFlow = ai.defineFlow(
  {
    name: 'morphObjectIntoBackgroundFlow',
    inputSchema: MorphObjectIntoBackgroundInputSchema,
    outputSchema: MorphObjectIntoBackgroundOutputSchema,
  },
  async input => {
    const {output} = await morphObjectIntoBackgroundPrompt(input);
    return output!;
  }
);
