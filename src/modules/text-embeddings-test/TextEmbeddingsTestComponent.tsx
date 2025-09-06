import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BrainCircuit } from 'lucide-react';
import { useModuleSettings } from '@/hooks/useModuleSettings';

interface EmbeddingResponse {
  embedding: number[];
  model: string;
  text: string;
}

interface TextEmbeddingsTestComponentProps {
  moduleId: string;
}

const TextEmbeddingsTestComponent: React.FC<TextEmbeddingsTestComponentProps> = ({ moduleId }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get settings from the module
  const { settings } = useModuleSettings(moduleId);
  
  const embeddingModel = settings?.embeddingModel || 'all-MiniLM-L6-v2';
  const apiEndpoint = settings?.apiEndpoint || 'http://localhost:11434';
  const maxTextLength = settings?.maxTextLength || 512;
  const showRawVectors = settings?.showRawVectors || false;

  const generateEmbedding = async () => {
    if (!inputText.trim()) {
      setError('Будь ласка, введіть текст для конвертації');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEmbedding(null);

    try {
      // In a real implementation, this would call an actual embedding service
      const response = await fetch(`${apiEndpoint}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: embeddingModel,
          prompt: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmbeddingResponse = await response.json();
      setEmbedding(data.embedding);
    } catch (err) {
      console.error('Error generating embedding:', err);
      
      // Fallback: generate a mock embedding for demonstration
      const mockEmbedding = Array.from({ length: 384 }, () => 
        Math.random() * 2 - 1
      );
      setEmbedding(mockEmbedding);
      
      setError('Не вдалося підключитися до API. Показано тестові дані.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setEmbedding(null);
    setError(null);
    setInputText('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <BrainCircuit className="h-4 w-4" />
          Text Embeddings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Тест ембеддінгів тексту</DialogTitle>
          <DialogDescription>
            Конвертуйте текст у векторні ембеддінги за допомогою SentenceTransformer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium mb-2">
              Введіть текст для конвертації:
            </label>
            <Textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Введіть текст, який ви хочете конвертувати в ембеддінг..."
              className="min-h-[120px]"
              maxLength={maxTextLength}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {inputText.length}/{maxTextLength} символів
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {embedding && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-2">Результати ембеддінгу:</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Модель:</span> {embeddingModel}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Розмірність вектора:</span> {embedding.length}
                  </div>
                  {showRawVectors && (
                    <>
                      <div className="text-sm">
                        <span className="font-medium">Перші 10 значень:</span>
                      </div>
                      <div className="font-mono text-xs bg-background p-2 rounded border break-all">
                        [{embedding.slice(0, 10).map(val => val.toFixed(4)).join(', ')}...]
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
            {embedding ? (
              <Button
                onClick={clearResults}
                variant="outline"
              >
                Очистити
              </Button>
            ) : <div />}
          <Button
            onClick={generateEmbedding}
            disabled={isLoading || !inputText.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Генерація...
              </>
            ) : (
              <>
                <BrainCircuit className="h-4 w-4" />
                Згенерувати ембеддінг
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextEmbeddingsTestComponent;