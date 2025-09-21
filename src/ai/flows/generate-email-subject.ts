'use server';

/**
 * @fileOverview Email subject line generator for reports based on cohort details and the current date.
 *
 * - generateEmailSubject - A function that generates the email subject line.
 * - GenerateEmailSubjectInput - The input type for the generateEmailSubject function.
 * - GenerateEmailSubjectOutput - The return type for the generateEmailSubject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailSubjectInputSchema = z.object({
  cohortDetails: z.string().describe('Details of the selected cohorts (e.g., Cohort A, Cohort B).'),
  reportType: z.string().describe('The type of report being sent (e.g., Submission Summary).'),
});
export type GenerateEmailSubjectInput = z.infer<typeof GenerateEmailSubjectInputSchema>;

const GenerateEmailSubjectOutputSchema = z.object({
  subjectLine: z.string().describe('The generated email subject line.'),
});
export type GenerateEmailSubjectOutput = z.infer<typeof GenerateEmailSubjectOutputSchema>;

export async function generateEmailSubject(input: GenerateEmailSubjectInput): Promise<GenerateEmailSubjectOutput> {
  return generateEmailSubjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailSubjectPrompt',
  input: {schema: GenerateEmailSubjectInputSchema},
  output: {schema: GenerateEmailSubjectOutputSchema},
  prompt: `You are an expert in writing concise and informative email subject lines.

  Generate an email subject line for a report with the following details:
  Report Type: {{{reportType}}}

The subject line should be clear, relevant, and easily understood by the recipient. It should just be the report type.
`,
});

const generateEmailSubjectFlow = ai.defineFlow(
  {
    name: 'generateEmailSubjectFlow',
    inputSchema: GenerateEmailSubjectInputSchema,
    outputSchema: GenerateEmailSubjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
