// pages/pingone-verify.js - Credential Verification Tool
import { useState } from 'react';
import Head from 'next/head';

export default function PingOneVerify() {
  const [credentials, setCredentials] = useState({
    environmentId: '83d2def8-b21f-4e7a-a9e9-f59a08caabcb',
    clientId: '800bf5cc-a3e9-4f15-986a-32fc445e1384',
    clientSecret: ''
  });
  
  const [results, setResults] = useState([]);

  const addResult = (title, content, type = 'info') => {
    const bgClass = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                   type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                   type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                   'bg-blue-50 border-blue-200 text-blue-800';
    
    setResults(prev => [...prev, {
      id: Date.now(),
      title,
      content,
      className: `p-4 rounded-md border ${bgClass} mb-4`
    }]);
  };

  const testCredentials = async () => {
    if (!credentials.clientSecret.trim()) {
      addResult('❌ Missing Client Secret', 'Please enter your client secret', 'error');
      return;
    }

    // Clear previous results
    setResults([]);

    const tokenUrl = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
    
    addResult('🔄 Testing Credentials', `Environment ID: ${credentials.environmentId}\nClient ID: ${credentials.clientId}\nToken URL: ${tokenUrl}`, 'info');

    try {
      // Create exact request like working Postman
      const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
      });

      const authHeader = btoa(`${credentials.clientId}:${credentials.clientSecret}`);

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
        addResult('✅ Credentials Valid!', `Success! Access token received.\n\nToken Type: ${tokenData.token_type}\nScope: ${tokenData.scope}\nExpires In: ${tokenData.expires_in} seconds`, 'success');
        
        // Now test API access with the token
        await testApiAccess(tokenData.access_token);
        
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }

        if (errorData.error === 'invalid_client') {
          addResult('❌ Invalid Client Credentials', `The Client ID or Client Secret is incorrect.\n\nReceived Error: ${errorData.error}\nDescription: ${errorData.error_description || 'Invalid client credentials'}\n\n🔍 Double-check:\n• Client ID: ${credentials.clientId}\n• Client Secret: [HIDDEN]\n• Environment ID: ${credentials.environmentId}`, 'error');
        } else if (errorData.error === 'invalid_scope') {
          addResult('❌ Invalid Scope', `Your PingOne application doesn't have the required scopes.\n\nError: ${errorData.error}\nDescription: ${errorData.error_description}\n\n🔧 Fix: Add these scopes to your PingOne application:\n• p1:read:user\n• p1:create:user\n• p1:update:user\n• p1:delete:user\n• p1:read:environment`, 'error');
        } else {
          addResult('❌ Authentication Failed', `Status: ${response.status}\nError: ${errorData.error}\nDescription: ${errorData.error_description || 'Unknown error'}\n\nFull Response:\n${responseText}`, 'error');
        }
      }
    } catch (error) {
      addResult('❌ Network Error', `Failed to connect: ${error.message}`, 'error');
    }
  };

  const testApiAccess = async (accessToken) => {
    addResult('🔄 Testing API Access', 'Testing environment API access with received token...', 'info');

    try {
      const envUrl = `https://api.pingone.com/v1/environments/${credentials.environmentId}`;
      
      const response = await fetch(envUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const envData = await response.json();
        addResult('✅ Environment API Access', `Environment Name: ${envData.name}\nEnvironment Type: ${envData.type}\nEnvironment ID: ${envData.id}\n\n✅ Your credentials have full API access!`, 'success');
        
        // Test Users API
        await testUsersApi(accessToken);
      } else {
        const errorText = await response.text();
        addResult('❌ Environment API Error', `Status: ${response.status}\nError: ${errorText}`, 'error');
      }
    } catch (error) {
      addResult('❌ Environment API Network Error', error.message, 'error');
    }
  };

  const testUsersApi = async (accessToken) => {
    addResult('🔄 Testing Users API', 'Testing users API access...', 'info');

    try {
      const usersUrl = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users?limit=1`;
      
      const response = await fetch(usersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        const totalUsers = usersData.count || 0;
        addResult('✅ Users API Access', `Users API is accessible!\nTotal Users: ${totalUsers}\n\n🎉 All tests passed! Your PingOne integration is working correctly.`, 'success');
      } else {
        const errorText = await response.text();
        addResult('⚠️ Users API Limited', `Status: ${response.status}\nError: ${errorText}\n\nThis might be a scope or permission issue.`, 'warning');
      }
    } catch (error) {
      addResult('❌ Users API Network Error', error.message, 'error');
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <>
      <Head>
        <title>PingOne Credential Verification</title>
      </Head>
      
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6 text-blue-600">🔐 PingOne Credential Verification</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h2 className="text-sm font-medium text-blue-800 mb-2">✅ Network Test Passed</h2>
              <p className="text-sm text-blue-700">
                Great! Your network can reach PingOne. Now let's verify your credentials are correct.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environment ID</label>
                <input 
                  type="text" 
                  value={credentials.environmentId}
                  onChange={(e) => handleInputChange('environmentId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm" 
                />
                <p className="text-xs text-gray-500 mt-1">From your PingOne Admin Console</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                <input 
                  type="text" 
                  value={credentials.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm" 
                />
                <p className="text-xs text-gray-500 mt-1">From your PingOne Application</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                <input 
                  type="password" 
                  value={credentials.clientSecret}
                  onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                  placeholder="Enter your client secret from PingOne"
                  className="w-full px-3 py-2 border rounded-md" 
                />
                <p className="text-xs text-gray-500 mt-1">This is the secret key from your PingOne application</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={testCredentials}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                🧪 Verify Credentials
              </button>
              
              <button 
                onClick={clearResults}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear Results
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className={result.className}>
                <h3 className="font-semibold mb-2">{result.title}</h3>
                <pre className="text-sm overflow-auto whitespace-pre-wrap">{result.content}</pre>
              </div>
            ))}
          </div>

          {/* Troubleshooting Guide */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">🔧 Troubleshooting Guide</h2>
            
            <div className="space-y-4 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h3 className="font-medium text-yellow-800">If you get "invalid_client" error:</h3>
                <ul className="mt-2 text-yellow-700 space-y-1">
                  <li>• Double-check Client ID and Client Secret from PingOne Admin Console</li>
                  <li>• Ensure the application has "Client Credentials" grant type enabled</li>
                  <li>• Verify you're using the correct Environment ID</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h3 className="font-medium text-blue-800">If you get "invalid_scope" error:</h3>
                <ul className="mt-2 text-blue-700 space-y-1">
                  <li>• Go to your PingOne Application → Configuration → Resources</li>
                  <li>• Add these scopes: p1:read:user, p1:create:user, p1:update:user, p1:delete:user</li>
                  <li>• Save and try again</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}