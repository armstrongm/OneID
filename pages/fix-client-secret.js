import { useState } from 'react';

export default function PingOneClientSecretFix() {
  const [credentials, setCredentials] = useState({
    clientId: '725210fd-3e86-449e-b992-27621e50b76a',
    clientSecret: '',
    environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72'
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setTestResult(null); // Clear previous results when inputs change
  };

  const testCredentials = async () => {
    if (!credentials.clientSecret.trim()) {
      setTestResult({
        success: false,
        error: 'Please enter the Client Secret'
      });
      return;
    }

    setTesting(true);
    setTestResult({ testing: true });

    try {
      // Test directly with PingOne (same as your working Postman request)
      const tokenUrl = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
      
      const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
      });

      const authString = `${credentials.clientId}:${credentials.clientSecret}`;
      const authHeader = btoa(authString);

      console.log('Testing credentials:');
      console.log('- Client ID:', credentials.clientId);
      console.log('- Client Secret length:', credentials.clientSecret.length);
      console.log('- Environment ID:', credentials.environmentId);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const tokenData = JSON.parse(responseText);
        setTestResult({
          success: true,
          message: '✅ Credentials are CORRECT!',
          details: {
            access_token: 'RECEIVED',
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope
          }
        });
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }

        if (errorData.error === 'invalid_client') {
          setTestResult({
            success: false,
            error: 'Invalid Client Credentials',
            message: '❌ The Client ID or Client Secret is WRONG',
            details: errorData,
            suggestions: [
              'Double-check the Client Secret - it should be exactly as shown in PingOne Admin Console',
              'Make sure there are no extra spaces or hidden characters',
              'Verify the Client ID is correct',
              'Check that this application exists in the right PingOne environment'
            ]
          });
        } else {
          setTestResult({
            success: false,
            error: errorData.error || 'Unknown error',
            message: errorData.error_description || 'PingOne returned an error',
            details: errorData
          });
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network Error',
        message: `Failed to connect: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const updateConnectionWithCorrectSecret = async () => {
    if (!testResult?.success) {
      alert('Please test the credentials successfully first');
      return;
    }

    try {
      const response = await fetch('/api/connections/pingone-default', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'PingOne Connection (Fixed)',
          clientSecret: credentials.clientSecret, // Use the working client secret
          environmentId: credentials.environmentId
        })
      });

      if (response.ok) {
        alert('✅ Connection updated with correct client secret!');
        setTestResult(prev => ({
          ...prev,
          updated: true,
          updateMessage: 'Connection successfully updated in your system!'
        }));
      } else {
        const error = await response.json();
        alert(`❌ Failed to update connection: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Network error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🔧 Fix PingOne Client Secret
        </h1>
        <p className="text-gray-600">
          Your connection update is working, but the stored client secret is wrong. 
          Let's test and fix it.
        </p>
      </div>

      {/* Credentials Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            value={credentials.clientId}
            onChange={(e) => handleInputChange('clientId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your PingOne Client ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={credentials.clientSecret}
            onChange={(e) => handleInputChange('clientSecret', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your ACTUAL PingOne Client Secret"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copy this EXACTLY from PingOne Admin Console → Applications → Your App → Configuration
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Environment ID
          </label>
          <input
            type="text"
            value={credentials.environmentId}
            onChange={(e) => handleInputChange('environmentId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your PingOne Environment ID"
          />
        </div>
      </div>

      {/* Test Button */}
      <div className="mb-6">
        <button
          onClick={testCredentials}
          disabled={testing || !credentials.clientSecret.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? '🔄 Testing Credentials...' : '🧪 Test These Credentials'}
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className={`p-4 rounded-md border mb-6 ${
          testResult.success 
            ? 'bg-green-50 border-green-200 text-green-800'
            : testResult.testing
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {testResult.testing ? (
            <div>🔄 Testing credentials with PingOne...</div>
          ) : (
            <div>
              <div className="font-semibold mb-2">{testResult.message}</div>
              
              {testResult.success && testResult.details && (
                <div className="text-sm">
                  <div>✅ Token Type: {testResult.details.token_type}</div>
                  <div>✅ Expires In: {testResult.details.expires_in} seconds</div>
                  <div>✅ Scope: {testResult.details.scope}</div>
                </div>
              )}
              
              {!testResult.success && testResult.suggestions && (
                <div className="text-sm mt-2">
                  <div className="font-medium mb-1">💡 Suggestions:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {testResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResult.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Technical Details
                  </summary>
                  <pre className="text-xs mt-1 bg-black bg-opacity-10 p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* Update Connection Button */}
      {testResult?.success && !testResult.updated && (
        <div className="mb-6">
          <button
            onClick={updateConnectionWithCorrectSecret}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            ✅ Update Connection with Correct Secret
          </button>
        </div>
      )}

      {testResult?.updated && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800 font-semibold">
            🎉 Connection Updated Successfully!
          </div>
          <div className="text-green-700 text-sm mt-1">
            Your connection now has the correct client secret and should work properly.
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">📋 How to Get Your Client Secret:</h3>
        <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
          <li>Log into PingOne Admin Console</li>
          <li>Go to <strong>Connections → Applications</strong></li>
          <li>Find your application (Client ID: {credentials.clientId})</li>
          <li>Click on it and go to <strong>Configuration</strong></li>
          <li>Copy the <strong>Client Secret</strong> exactly as shown</li>
          <li>Paste it in the field above and test</li>
        </ol>
      </div>
    </div>
  );
}