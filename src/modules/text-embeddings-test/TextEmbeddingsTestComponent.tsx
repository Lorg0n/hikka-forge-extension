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
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useModuleSettings } from '@/hooks/useModuleSettings';
import { useTextEmbedding } from '@/hooks/useTextEmbedding';

interface TextEmbeddingsTestComponentProps {
  moduleId: string;
}

const TextEmbeddingsTestComponent: React.FC<TextEmbeddingsTestComponentProps> = ({ moduleId }) => {
  const [inputText, setInputText] = useState('');
  
  // Consume the custom hook to manage state and logic
  const { embedding, isLoading, error, progress, generateEmbedding, clearEmbedding } = useTextEmbedding();
  
  const { settings } = useModuleSettings(moduleId);
  
  const embeddingModel = settings?.embeddingModel || 'Lorg0n/hikka-forge-paraphrase-multilingual-MiniLM-L12-v2';
  const apiEndpoint = settings?.apiEndpoint || '';
  const maxTextLength = settings?.maxTextLength || 512;
  const showRawVectors = settings?.showRawVectors || false;

  const handleGenerateClick = () => {
    generateEmbedding({
      prompt: inputText,
    });
  };

  const handleClearClick = () => {
    clearEmbedding();
    setInputText('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BrainCircuit className="h-4 w-4" />
          Text Embeddings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Text Embeddings</DialogTitle>
          <DialogDescription>
            Convert text into vector embeddings using a SentenceTransformer model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium mb-2">
              Enter text to embed:
            </label>
            <Textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the text you want to convert into an embedding..."
              className="min-h-[120px]"
              maxLength={maxTextLength}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {inputText.length}/{maxTextLength} characters
            </div>
          </div>

          {isLoading && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="border rounded-lg p-4 bg-muted/50 animate-pulse">
                <h4 className="font-medium text-sm mb-2">Generating Embedding...</h4>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/3" />
                  {showRawVectors && (
                    <>
                      <Skeleton className="h-4 w-1/5" />
                      <Skeleton className="h-20 w-full" />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && embedding && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-2">Embedding Results:</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Model:</span> {embeddingModel}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Vector Dimensions:</span> {embedding.length}
                  </div>
                  {showRawVectors && (
                    <>
                      <div className="text-sm">
                        <span className="font-medium">First 10 values:</span>
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
            <Button onClick={handleClearClick} variant="outline">
              Clear
            </Button>
          ) : <div />}
          <Button
            onClick={handleGenerateClick}
            disabled={isLoading || !inputText.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BrainCircuit className="h-4 w-4" />
                Generate Embedding
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextEmbeddingsTestComponent;
