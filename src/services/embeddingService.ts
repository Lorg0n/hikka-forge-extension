import browser from 'webextension-polyfill';

/**
 * Interface for the parameters required to generate an embedding.
 */
interface GenerateEmbeddingParams {
    prompt: string;
}

/**
 * Defines the shape of the response from the background script.
 */
type EmbeddingResponse =
    | {
        success: true;
        embedding: number[];
    }
    | {
        success: false;
        error: string;
    };

/**
 * Sends a message to the background script to fetch text embeddings.
 * This abstracts away the chrome.runtime.sendMessage logic.
 *
 * @param params - The parameters for the embedding request.
 * @returns A promise that resolves with the embedding vector (number[]).
 * @throws An error if the background script returns an error or fails.
 */
export const generateEmbedding = async ({
    prompt,
}: GenerateEmbeddingParams): Promise<number[]> => {
    if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this browser. The search feature requires WebAssembly support.');
    }

    // --- START: FIX ---
    // Instead of using a generic on the function call, which can be buggy,
    // we await the result (which is 'any') and then cast it to our specific type.
    // This is a more robust pattern.
    const response = await browser.runtime.sendMessage({
        type: "FETCH_EMBEDDING",
        payload: {
            prompt,
        }
    }) as EmbeddingResponse;
    // --- END: FIX ---

    // Now, all subsequent checks are fully type-safe because 'response' is correctly typed.
    if (!response || !response.success) {
        const errorMessage = response?.error || 'An unknown error occurred in the background script.';
        
        if (errorMessage.includes('WebAssembly') || errorMessage.includes('wasm')) {
            throw new Error(`Search failed: WebAssembly error - ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
    }

    // On success, TypeScript knows 'response.embedding' must exist.
    return response.embedding;
};

/**
 * Checks if the embedding service is available (WebAssembly support)
 */
export const isEmbeddingServiceAvailable = (): boolean => {
    return typeof WebAssembly !== 'undefined';
};