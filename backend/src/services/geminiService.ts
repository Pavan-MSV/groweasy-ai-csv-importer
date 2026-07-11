import { getGeminiClient } from '../config/gemini';
import { SYSTEM_INSTRUCTION, buildUserPrompt } from '../prompts/mappingPrompt';
import { CRMRecord, localMapRecordsBatch } from './localMapperService';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Helper for wait/sleep
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean up markdown response formatting (if any) and parse JSON.
 */
function cleanAndParseJSON(text: string): CRMRecord[] {
  let cleaned = text.trim();
  
  // Remove markdown code fences if Gemini ignores responseMimeType instructions
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
  }
  
  return JSON.parse(cleaned);
}

/**
 * Call Gemini to process a batch of records. Falls back to local mapper on failure or if API key is missing.
 */
export async function mapRecordsWithGemini(
  records: Record<string, string>[]
): Promise<{ imported: CRMRecord[]; skippedCount: number; method: 'gemini' | 'local'; error?: string }> {
  const client = getGeminiClient();
  
  if (!client) {
    console.log('[GeminiService] No API key configured. Falling back to local mapping engine.');
    const result = localMapRecordsBatch(records);
    return { ...result, method: 'local' };
  }

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      console.log(`[GeminiService] Batch Mapping Attempt ${attempt + 1}/${maxRetries} using model: ${MODEL_NAME}`);
      
      const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents: buildUserPrompt(records),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }

      const parsed = cleanAndParseJSON(responseText);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Gemini response is not a valid JSON array');
      }

      // Filter out records that might still slip through without email and mobile (just in case)
      const imported: CRMRecord[] = [];
      let skippedCount = 0;

      for (const rec of parsed) {
        if (!rec.email && !rec.mobile_without_country_code) {
          skippedCount++;
        } else {
          // Normalize and fill default fields to match CRMRecord interface
          imported.push({
            created_at: rec.created_at || '',
            name: rec.name || '',
            email: rec.email || '',
            country_code: rec.country_code || '',
            mobile_without_country_code: rec.mobile_without_country_code || '',
            company: rec.company || '',
            city: rec.city || '',
            state: rec.state || '',
            country: rec.country || '',
            lead_owner: rec.lead_owner || '',
            crm_status: rec.crm_status || '',
            crm_note: rec.crm_note || '',
            data_source: rec.data_source || '',
            possession_time: rec.possession_time || '',
            description: rec.description || '',
          });
        }
      }

      // Account for skipped records from input list size vs parsed size
      const mappedRecordIds = new Set(imported.map(r => r.email || r.mobile_without_country_code));
      let missingFromInputCount = 0;
      
      // Calculate how many records from the input batch were skipped/filtered out
      for (const item of records) {
        // If it doesn't match any output, it was skipped
        const matchesAny = imported.some(r => 
          (r.email && (item.email === r.email || Object.values(item).includes(r.email))) ||
          (r.mobile_without_country_code && Object.values(item).includes(r.mobile_without_country_code))
        );
        if (!matchesAny) {
          missingFromInputCount++;
        }
      }

      const totalSkipped = Math.max(skippedCount, missingFromInputCount);

      return {
        imported,
        skippedCount: totalSkipped,
        method: 'gemini'
      };

    } catch (error: any) {
      attempt++;
      console.warn(`[GeminiService] Attempt ${attempt} failed: ${error.message || error}`);
      
      if (attempt < maxRetries) {
        // Wait with exponential backoff before retrying
        const delay = Math.pow(2, attempt) * 1000;
        await wait(delay);
      } else {
        // All retries failed. Log and fall back to local mapper.
        console.error(`[GeminiService] All Gemini attempts failed. Falling back to local mapping engine for this batch.`);
        const localResult = localMapRecordsBatch(records);
        return {
          ...localResult,
          method: 'local',
          error: error.message || 'Gemini processing failed, fallback to local mapper'
        };
      }
    }
  }

  // Fallback default (should not be reached due to loop exit logic)
  const fallback = localMapRecordsBatch(records);
  return { ...fallback, method: 'local' };
}
