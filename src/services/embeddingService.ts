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
        throw new Error(errorMessage);
    }

    // On success, return the embedding data.
    return response.embedding;
};
