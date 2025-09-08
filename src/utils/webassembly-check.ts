/**
 * Utility functions for WebAssembly support detection
 */

/**
 * Checks if the browser supports WebAssembly
 * @returns boolean indicating WebAssembly support
 */
export const supportsWebAssembly = (): boolean => {
  try {
    return typeof WebAssembly !== 'undefined' && 
           typeof WebAssembly.instantiate === 'function' &&
           typeof WebAssembly.compile === 'function';
  } catch (e) {
    return false;
  }
};

/**
 * Checks if WebAssembly is available and functional
 * This performs a more thorough check than just feature detection
 */
export const checkWebAssemblyAvailability = async (): Promise<{
  supported: boolean;
  error?: string;
}> => {
  if (!supportsWebAssembly()) {
    return { supported: false, error: 'WebAssembly is not supported in this browser' };
  }

  try {
    // Test WebAssembly functionality with a simple module
    const wasmCode = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM magic number
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // type section
      0x03, 0x02, 0x01, 0x00, // function section
      0x07, 0x05, 0x01, 0x01, 0x74, 0x00, 0x00, // export section
      0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b // code section
    ]);

    const module = await WebAssembly.compile(wasmCode);
    const instance = await WebAssembly.instantiate(module);
    
    return { supported: true };
  } catch (error) {
    return { 
      supported: false, 
      error: `WebAssembly test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Gets detailed WebAssembly support information
 */
export const getWebAssemblySupportInfo = async (): Promise<{
  supported: boolean;
  features: {
    simd: boolean;
    threads: boolean;
    bulkMemory: boolean;
    referenceTypes: boolean;
  };
  error?: string;
}> => {
  const baseSupport = supportsWebAssembly();
  
  if (!baseSupport) {
    return {
      supported: false,
      features: {
        simd: false,
        threads: false,
        bulkMemory: false,
        referenceTypes: false
      },
      error: 'WebAssembly not supported'
    };
  }

  try {
    // Check for specific WebAssembly features
    const features = {
      simd: await checkFeature('simd'),
      threads: await checkFeature('threads'),
      bulkMemory: await checkFeature('bulk-memory'),
      referenceTypes: await checkFeature('reference-types')
    };

    return { supported: true, features };
  } catch (error) {
    return {
      supported: true,
      features: {
        simd: false,
        threads: false,
        bulkMemory: false,
        referenceTypes: false
      },
      error: `Feature detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Checks if a specific WebAssembly feature is supported
 */
const checkFeature = async (feature: string): Promise<boolean> => {
  try {
    // This is a simplified check - actual feature detection would be more complex
    // For now, we'll assume basic WebAssembly support means these features might be available
    // but we'll return false for all to be conservative
    return false;
  } catch {
    return false;
  }
};

/**
 * Hook for React components to check WebAssembly support
 * Note: This hook should be used in React components only
 */
export const useWebAssemblySupport = () => {
  if (typeof window === 'undefined') {
    // Not in browser environment
    return { isSupported: false, isChecking: false, error: 'Not in browser environment' };
  }
  
  // This hook is designed to be used in React components that already import React
  // The consumer should import React and use this hook accordingly
  return { isSupported: supportsWebAssembly(), isChecking: false, error: null };
};
