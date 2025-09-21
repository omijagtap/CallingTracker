'use server';

/**
 * @fileOverview Validates the format and completeness of an uploaded CSV file.
 *
 * - validateCsvFormat - A function that validates the CSV file format.
 * - ValidateCsvFormatInput - The input type for the validateCsvFormat function.
 * - ValidateCsvFormatOutput - The return type for the validateCsvFormat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateCsvFormatInputSchema = z.object({
  csvHeaders: z
    .array(z.string())
    .describe('An array of header columns from the CSV file.'),
});
export type ValidateCsvFormatInput = z.infer<
  typeof ValidateCsvFormatInputSchema
>;

const ValidateCsvFormatOutputSchema = z.object({
  isValid: z
    .boolean()
    .describe(
      'Whether the CSV file is valid and contains all required fields.'
    ),
  missingColumns: z
    .array(z.string())
    .optional()
    .describe('An array of missing column names if the validation fails.'),
  errorMessage: z
    .string()
    .optional()
    .describe('A user-friendly error message if the CSV file is not valid.'),
});
export type ValidateCsvFormatOutput = z.infer<
  typeof ValidateCsvFormatOutputSchema
>;

export async function validateCsvFormat(
  input: ValidateCsvFormatInput
): Promise<ValidateCsvFormatOutput> {
  return validateCsvFormatFlow(input);
}

const requiredColumns = ['Learner Type', 'Submission Status', 'AO Date', 'Email'];

const prompt = ai.definePrompt({
  name: 'validateCsvFormatPrompt',
  input: {schema: ValidateCsvFormatInputSchema},
  output: {schema: ValidateCsvFormatOutputSchema},
  prompt: `You are a data validation expert. Your task is to validate the headers of a CSV file.

The CSV file MUST contain the following columns: ${requiredColumns.join(', ')}.

The uploaded CSV file has the following headers:
{{#each csvHeaders}}
- {{{this}}}
{{/each}}

Compare the required columns with the actual headers provided. The match should be case-insensitive and ignore leading/trailing spaces.

- If all required columns are present, set \`isValid\` to true.
- If any required columns are missing, set \`isValid\` to false.
- In the \`missingColumns\` array, list all the required columns that were not found in the CSV headers.
- Based on the missing columns, construct a user-friendly \`errorMessage\`. For example: "The CSV file is missing the following required columns: 'Column A', 'Column B'."

Respond with a valid JSON object matching the output schema.
`,
});

const validateCsvFormatFlow = ai.defineFlow(
  {
    name: 'validateCsvFormatFlow',
    inputSchema: ValidateCsvFormatInputSchema,
    outputSchema: ValidateCsvFormatOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (output) {
        return output;
      }
    } catch (e) {
        console.error("AI validation failed, falling back to manual check.", e)
    }
    
    // Fallback validation in case the AI fails or doesn't return output
    const providedHeaders = new Set(input.csvHeaders.map(h => h.toLowerCase().trim()));
    const missing: string[] = [];
    for (const col of requiredColumns) {
      if (!providedHeaders.has(col.toLowerCase())) {
        missing.push(col);
      }
    }

    if (missing.length > 0) {
      return {
        isValid: false,
        missingColumns: missing,
        errorMessage: `The CSV file is missing the following required columns: ${missing.map(m => `'${m}'`).join(', ')}.`,
      };
    } else {
      return { isValid: true };
    }
  }
);
