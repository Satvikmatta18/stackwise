import React from 'react';
import ApiTestButton from '../components/ApiTestButton';

const ApiTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gemini API Test
            </h1>
            <p className="text-gray-600">
              Test your Google Gemini API key to ensure it's working correctly
            </p>
          </div>
          
          <ApiTestButton />
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to test:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Make sure your Flask backend is running on port 5001</li>
              <li>Click the "Test Gemini API" button above</li>
              <li>Check the result to see if your API key is working</li>
              <li>If it fails, check your API key and network connection</li>
            </ol>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Alternative testing methods:</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>
                <strong>Command line:</strong> Run{' '}
                <code className="bg-yellow-100 px-1 rounded">python backend/test_gemini_api.py</code>
              </li>
              <li>
                <strong>Direct API call:</strong> Visit{' '}
                <code className="bg-yellow-100 px-1 rounded">http://localhost:5001/api/test-gemini</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage; 