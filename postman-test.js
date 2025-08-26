// pages/postman-test.js - Test exact Postman match
import { useState } from 'react';
import Head from 'next/head';

export default function PostmanTest() {
  const [credentials, setCredentials] = useState({
    environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72',
    clientId: '725210fd-3e86-449e-b992-27621e50b76a',
    clientSecret: ''
  });
  
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testPostmanExact = async () => {
    if (!credentials.clientSecret.trim()) {
      setResult({
        type: 'error',
        title: 'Missing Client Secret',
        content: 'Please enter your client secret first'
      });
      return;
    }

    setTesting(true);
    setResult({
      type: 'info',
      title: 'Testing Postman Exact Match',
      content: 'Making request with exact Postman format...'
    });

    try {
      const response = await fetch('/api/settings/pingone/postman-exact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          title: 'SUCCESS! Postman Match Worked',
          content: `${data.message}\n\nToken Details:\n${JSON.stringify(data.token, null, 2)}\n\nNow your web application should work the same way!`
        });
      } else {
        let errorContent = `Error: ${data.error}\n\n${data.message}`;
        
        if (data.debug) {
          errorContent += `\n\nDebug Information:\n${JSON.stringify(data.debug, null, 2)}`;
        }
        
        if (data.suggestions) {
          errorContent += `\n\nSuggestions:\n${data.suggestions.map(s => `• ${s}`).join('\n')}`;
        }

        setResult({
          type: 'error',
          title: 'Authentication Failed',
          content: errorContent
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        title: 'Network Error',
        content: `Failed to connect: ${error.message}\n\nMake sure you created /api/settings/pingone/postman-exact.js`
      });
    }

    setTesting(false);
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getResultClass = () => {
    if (!result) return '';
    
    switch (result.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Postman Exact Match Test</title>
      </Head>
      
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6 text-blue-600">Postman Exact Match Test</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h2 className="text-sm font-medium text-blue-800 mb-2">Goal</h2>
              <p className="text-sm text-blue-700">
                This will make a request using the exact same format as your working Postman request.
                If this works, we'll know exactly how to fix your main application.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environment ID</label>
                <input 
                  type="text" 
                  value={credentials.environmentId}
                  onChange={(e) => handleInputChange('environmentId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50" 
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                <input 
                  type="text" 
                  value={credentials.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50" 
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                <input 
                  type="password" 
                  value={credentials.clientSecret}
                  onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                  placeholder="Paste your exact client secret from Postman here"
                  className="w-full px-3 py-2 border rounded-md" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy this exactly from your Postman adminAppSecret variable
                </p>
              </div>
            </div>

            <button 
              onClick={testPostmanExact}
              disabled={testing}
              className={`w-full px-6 py-3 text-white rounded-md font-medium ${
                testing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {testing ? 'Testing Exact Postman Match...' : 'Test Exact Postman Match'}
            </button>
          </div>

          {result && (
            <div className={`p-4 border rounded-md ${getResultClass()}`}>
              <h3 className="font-semibold mb-2">{result.title}</h3>
              <pre className="text-sm overflow-auto whitespace-pre-wrap">{result.content}</pre>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">What This Test Does</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">1</div>
                <p>Uses your exact Environment ID and Client ID from the verification tool</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">2</div>
                <p>Creates the Authorization header using the same method as Postman</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">3</div>
                <p>Sends the exact same request body and headers as your working Postman</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">4</div>
                <p>If this works, we can apply the same format to your main application</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}