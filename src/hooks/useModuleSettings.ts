import { useState, useEffect } from 'react';

interface ModuleSettings {
  [key: string]: any;
}

export function useModuleSettings(moduleId: string) {
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In a real implementation, this would fetch settings from storage or API
        // For now, we'll use default settings based on the module ID
        const defaultSettings = getDefaultSettings(moduleId);
        setSettings(defaultSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [moduleId]);

  const updateSettings = async (newSettings: Partial<ModuleSettings>) => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      // In a real implementation, this would save to storage or API
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
}

function getDefaultSettings(moduleId: string): ModuleSettings {
  // Default settings for different modules
  const defaults: { [key: string]: ModuleSettings } = {
    'text-embeddings-test': {
      embeddingModel: 'all-MiniLM-L6-v2',
      apiEndpoint: 'http://localhost:11434',
      maxTextLength: 512,
      showRawVectors: false,
      enableCaching: true,
    },
  };

  return defaults[moduleId] || {};
}
