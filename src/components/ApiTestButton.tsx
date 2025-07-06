import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react';

interface ApiTestResult {
  success: boolean;
  message: string;
  response?: string;
  model?: string;
  error?: string;
}

const ApiTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);

  const testGeminiApi = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/test-gemini`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          response: data.response,
          model: data.model,
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Test failed',
          error: data.error,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error - could not connect to backend',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Gemini API Test
        </CardTitle>
        <CardDescription>
          Test if your Google Gemini API key is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testGeminiApi}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing API...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Test Gemini API
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <AlertDescription className="space-y-2">
                <div className="font-medium">
                  {result.success ? '✅ Success!' : '❌ Failed'}
                </div>
                <div className="text-sm">{result.message}</div>
                {result.response && (
                  <div className="text-sm text-gray-600">
                    <strong>Response:</strong> {result.response}
                  </div>
                )}
                {result.model && (
                  <div className="text-sm text-gray-600">
                    <strong>Model:</strong> {result.model}
                  </div>
                )}
                {result.error && (
                  <div className="text-sm text-red-600">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiTestButton; 