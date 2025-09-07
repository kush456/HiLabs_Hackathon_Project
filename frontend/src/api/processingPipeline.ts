import type { ProcessingResponse } from './types';

const API_BASE = 'http://localhost:5000';

export async function runProcessingPipeline(
  file: File | null
): Promise<{ result: ProcessingResponse | null; error: string | null; processingTimeMs: number }> {
  if (!file) {
    return { result: null, error: 'No file uploaded', processingTimeMs: 0 };
  }
  const startTime = Date.now();
  try {
    // 1. Standardization
    const standardizeRes = await fetch(`${API_BASE}/process/standardize`, {
      method: 'POST',
      body: (() => {
        const formData = new FormData();
        formData.append('file', file);
        return formData;
      })(),
    });
    if (!standardizeRes.ok) {
      throw new Error('Standardization failed');
    }
    const standardizeResult = await standardizeRes.json();
    if (standardizeResult.status !== 'success') {
      throw new Error(standardizeResult.error || 'Standardization failed');
    }

    // 2. Misspelling Correction (requires representatives.json)
    // You may need to adjust this to allow user upload of representatives.json
    // For now, try to fetch it from the backend/uploads directory
    const repsFile = await fetch('/uploads/representatives.json');
    let repsBlob: Blob | null = null;
    if (repsFile.ok) {
      repsBlob = await repsFile.blob();
    }
    if (!repsBlob) {
      throw new Error('Could not find representatives.json for misspelling correction');
    }
    const misspellingForm = new FormData();
    misspellingForm.append('representatives', new File([repsBlob], 'representatives.json', { type: 'application/json' }));
    const misspellingRes = await fetch(`${API_BASE}/process/misspelling`, {
      method: 'POST',
      body: misspellingForm,
    });
    if (!misspellingRes.ok) {
      throw new Error('Misspelling correction failed');
    }
    const misspellingResult = await misspellingRes.json();
    if (misspellingResult.status !== 'success') {
      throw new Error(misspellingResult.error || 'Misspelling correction failed');
    }

    // 3. Deduplication
    const response = await fetch(`${API_BASE}/process/complete-pipeline`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ProcessingResponse = await response.json();
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime; // milliseconds
    return { result, error: null, processingTimeMs };
  } catch (error: any) {
    return {
      result: null,
      error: error instanceof Error ? error.message : 'Processing failed',
      processingTimeMs: 0,
    };
  }
}