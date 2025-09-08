/**
 * Interface for the parameters required to generate an embedding.
 */
interface GenerateEmbeddingParams {
    prompt: string;
}

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
    // Check if WebAssembly is supported before attempting embedding
    if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this browser. The search feature requires WebAssembly support.');
    }

    // The response from the background script is awaited.
    const response = await chrome.runtime.sendMessage({
        type: "FETCH_EMBEDDING",
        payload: {
            prompt,
        }
    });

    // Error handling, similar to checking `response.ok` in a fetch call.
    if (!response || !response.success) {
        const errorMessage = response?.error || 'An unknown error occurred in the background script.';
        
        // Provide more specific error messages for WebAssembly-related issues
        if (errorMessage.includes('WebAssembly') || errorMessage.includes('wasm')) {
            throw new Error(`Search failed: WebAssembly error - ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
    }

    // On success, return the embedding data.
    return response.embedding;
};

/**
 * Checks if the embedding service is available (WebAssembly support)
 */
export const isEmbeddingServiceAvailable = (): boolean => {
    return typeof WebAssembly !== 'undefined';
};
