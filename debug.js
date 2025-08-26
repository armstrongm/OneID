// pages/debug.js - Next.js Debug Page
import { useState } from 'react';
import Head from 'next/head';

export default function DebugPage() {
  const [results, setResults] = useState({
    pingone: null,
    update: null,
    endpoints: {}
  });

  const showResult = (type, message, resultType = 'info') => {
    const newResults = { ...results };
    newResults[type] = { message, resultType };
    setResults(newResults);
  };

  const testPingOne = async () => {
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;
    const environmentId = document.getElementById('environmentId').value;
    const region = document.getElementById('region').value;

    if (!clientId || !clientSecret || !environmentId) {
      showResult('pingone', 'Please fill in all required fields', 'error');
      return;
    }

    showResult('pingone', 'Testing PingOne connection...', 'loading');

    try {
      const response = await fetch('/api/settings/pingone/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, environmentId, region })
      });

      const result = await response.json();

      if (response.ok) {
        showResult('pingone', `✅ PingOne connection successful!\n\nDetails:\n${JSON.stringify(result, null, 2)}`, 'success');
      } else {
        let errorMsg = `❌ PingOne connection failed (${response.status})\n\n`;
        
        if (result.error && result.error.includes('Authorization header requires')) {
          errorMsg += `🚨 AWS ENDPOINT DETECTED!\n\nYour token URL is pointing to AWS, not PingOne.\n\nExpected PingOne URL format:\n- NA: https://api.pingone.com/v1/environments/{env-id}/as/token\n- EU: https://api.pingone.eu/v1/environments/{env-id}/as/token\n- APAC: https://api.pingone.asia/v1/environments/{env-id}/as/token\n\n`;
        }
        
        errorMsg += `Error: ${result.error}\n\nSuggestions: ${result.suggestions ? result.suggestions.join(', ') : 'Check your configuration'}`;
        showResult('pingone', errorMsg, 'error');
      }
    } catch (error) {
      showResult('pingone', `❌ Network error: ${error.message}\n\nThis usually means:\n- API endpoint doesn't exist\n- Next.js server is not running\n- CORS issue`, 'error');
    }
  };

  const testConnectionUpdate = async () => {
    const connectionId = document.getElementById('connectionId').value;
    const connectionName = document.getElementById('connectionName').value;

    showResult('update', 'Testing connection update...', 'loading');

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: connectionName, status: 'connected' })
      });

      const result = await response.json();

      if (response.ok) {
        showResult('update', `✅ Connection updated successfully!\n\nResponse:\n${JSON.stringify(result, null, 2)}`, 'success');
      } else {
        showResult('update', `❌ Update failed (${response.status})\n\nError: ${result.error}\n\nResponse:\n${JSON.stringify(result, null, 2)}`, 'error');
      }
    } catch (error) {
      showResult('update', `❌ Network error: ${error.message}\n\nThis usually means:\n- /api/connections/[id].js doesn't exist\n- Next.js server is not running\n- CORS issue`, 'error');
    }
  };

  const testEndpoint = async (method, url, body = null) => {
    showResult('endpoints', `Testing ${method} ${url}...`, 'loading');

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const result = await response.json();
      
      const status = response.ok ? 'success' : 'error';
      const message = `${method} ${url} → ${response.status}\n\nResponse:\n${JSON.stringify(result, null, 2)}`;
      
      showResult('endpoints', message, status);
    } catch (error) {
      showResult('endpoints', `❌ ${method} ${url} failed: ${error.message}`, 'error');
    }
  };

  const getResultClass = (resultType) => {
    switch (resultType) {
      case 'success': return 'bg-green-50 border border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border border-red-200 text-red-800';
      case 'loading': return 'bg-blue-50 border border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border border-gray-200 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Connection Debug & Fix Tool</title>
      </Head>
      
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">🔧 Connection Debug & Fix Tool</h1>
            
            {/* PingOne Configuration Test */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-blue-800">🔍 1. PingOne Configuration Test</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input 
                    type="text" 
                    id="clientId" 
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="800bf5cc-a3e9-4f15-986a-32f3445"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                  <input 
                    type="password" 
                    id="clientSecret" 
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="Your PingOne Client Secret"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Environment ID</label>
                  <input 
                    type="text" 
                    id="environmentId" 
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="your-environment-id-here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select id="region" className="w-full px-3 py-2 border rounded-md">
                    <option value="NA">North America</option>
                    <option value="EU">Europe</option>
                    <option value="APAC">Asia Pacific</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={testPingOne}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🧪 Test PingOne Connection
              </button>
              
              {results.pingone && (
                <div className={`mt-4 p-4 rounded-md ${getResultClass(results.pingone.resultType)}`}>
                  <pre className="whitespace-pre-wrap text-sm">{results.pingone.message}</pre>
                </div>
              )}
            </div>

            {/* Connection Update Test */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-green-800">📝 2. Connection Update Test</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Connection ID</label>
                  <input 
                    type="text" 
                    id="connectionId" 
                    defaultValue="conn-1" 
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Connection Name</label>
                  <input 
                    type="text" 
                    id="connectionName" 
                    defaultValue="Updated Test Connection" 
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <button 
                onClick={testConnectionUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📝 Test Connection Update
              </button>
              
              {results.update && (
                <div className={`mt-4 p-4 rounded-md ${getResultClass(results.update.resultType)}`}>
                  <pre className="whitespace-pre-wrap text-sm">{results.update.message}</pre>
                </div>
              )}
            </div>

            {/* API Endpoints Test */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-purple-800">🌐 3. API Endpoints Test</h2>
              <div className="space-y-2">
                <button 
                  onClick={() => testEndpoint('GET', '/api/connections')}
                  className="mr-2 px-3 py-1 bg-purple-600 text-white rounded text-sm"
                >
                  GET /api/connections
                </button>
                <button 
                  onClick={() => testEndpoint('GET', '/api/connections/conn-1')}
                  className="mr-2 px-3 py-1 bg-purple-600 text-white rounded text-sm"
                >
                  GET /api/connections/conn-1
                </button>
                <button 
                  onClick={() => testEndpoint('PUT', '/api/connections/conn-1', {name: 'Test Update'})}
                  className="mr-2 px-3 py-1 bg-purple-600 text-white rounded text-sm"
                >
                  PUT /api/connections/conn-1
                </button>
              </div>
              
              {results.endpoints && (
                <div className={`mt-4 p-4 rounded-md ${getResultClass(results.endpoints.resultType)}`}>
                  <pre className="whitespace-pre-wrap text-sm">{results.endpoints.message}</pre>
                </div>
              )}
            </div>

            {/* Quick API Status Check */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold mb-2">🚀 Quick Status Check</h3>
              <p className="text-sm text-gray-600 mb-2">Click this to verify your Next.js API is running:</p>
              <button 
                onClick={() => testEndpoint('GET', '/api/test')}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
              >
                Test Basic API
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}