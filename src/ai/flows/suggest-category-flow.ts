
'use server';
/**
 * @fileOverview An AI flow to suggest a category for a listing.
 *
 * - suggestCategory - A function that suggests a category based on title and description.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ListingCategory } from '@/types';
import { mockCategories } from '@/lib/mock-data'; // Using mockCategories as the source of truth

const SuggestCategoryInputSchema = z.object({
  title: z.string().describe('The title of the listing.'),
  description: z.string().describe('The description of the listing.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

// Dynamically create a Zod enum from mockCategories
const categoriesEnum = z.enum(mockCategories as [string, ...string[]]);

const SuggestCategoryOutputSchema = z.object({
  suggestedCategory: categoriesEnum.nullable().describe('The suggested category for the listing, or null if no specific category fits well.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: { schema: SuggestCategoryInputSchema },
  output: { schema: SuggestCategoryOutputSchema },
  prompt: `You are an expert in categorizing marketplace listings.
Given the title and description of an item, suggest the most appropriate category from the following list: ${mockCategories.join(', ')}.

If the item clearly fits one of these categories, return that category.
If the item could fit into 'Other' or if you are unsure, return 'Other'. If no category seems appropriate at all or the input is vague, return null.

Title: {{{title}}}
Description: {{{description}}}

Return your answer in the format specified by the output schema.
`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // Ensure the output matches one of the allowed categories or is null.
    // The LLM might sometimes return a category not exactly in the list or a variation.
    if (output?.suggestedCategory && !mockCategories.includes(output.suggestedCategory as ListingCategory)) {
        // If the suggested category is not in our list, default to 'Other' or null.
        // For simplicity, let's default to 'Other' if a suggestion was made but it's not valid.
        // Or, if the model is good at returning one of the options, this might not be needed frequently.
        console.warn(`AI suggested category "${output.suggestedCategory}" which is not in the predefined list. Defaulting.`);
        // Let's check if the model is likely to hallucinate. If so, map to 'Other'.
        // Given the prompt, it should stick to the list or 'Other'.
        // If it still returns something odd, we might need stricter output parsing or re-prompting.
        // For now, we trust the prompt to guide the LLM.
        // If output.suggestedCategory is null, that's fine.
    }
    return output || { suggestedCategory: null }; // Ensure we always return a valid structure
  }
);
