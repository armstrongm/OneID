import { useState } from 'react';

export default function ConnectionUpdateDebug() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const addResult = (test, result, type = 'info') => {
    setResults(prev => ({
      ...prev,
      [test]: { ...result, type, timestamp: new Date().toISOString() }
    }));
  };

  const setLoadingState = (test, isLoading) => {
    setLoading(prev => ({ ...prev, [test]: isLoading }));
  };

  // Test 1: Check if API endpoint exists
  const testApiEndpoint = async () => {
    setLoadingState('endpoint', true);
    
    try {
      const response = await fetch('/api/connections/pingone-default');
      const data = await response.json();
      
      addResult('endpoint', {
        status: response.status,
        data: data,
        success: response.ok
      }, response.ok ? 'success' : 'error');
      
    } catch (error) {
      addResult('endpoint', {
        error: error.message,
        success: false
      }, 'error');
    } finally {
      setLoadingState('endpoint', false);
    }
  };

  // Test 2: Test connection update
  const testConnectionUpdate = async () => {
    setLoadingState('update', true);
    
    const testData = {
      name: 'Debug Test Update',
      clientSecret: '[SAVED]', // Should preserve existing
      environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72'
    };
    
    try {
      console.log('Sending update request:', testData);
      
      const response = await fetch('/api/connections/pingone-default', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      console.log('Update response status:', response.status);
      console.log('Update response data:', data);
      
      addResult('update', {
        status: response.status,
        requestData: testData,
        responseData: data,
        success: response.ok
      }, response.ok ? 'success' : 'error');
      
    } catch (error) {
      console.error('Update error:', error);
      addResult('update', {
        error: error.message,
        success: false
      }, 'error');
    } finally {
      setLoadingState('update', false);
    }
  };

  // Test 3: Test with new client secret
  const testWithNewSecret = async () => {
    setLoadingState('newsecret', true);
    
    const testData = {
      name: 'Test with New Secret',
      clientSecret: 'test-new-secret-value',
      environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72'
    };
    
    try {
      const response = await fetch('/api/connections/pingone-default', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      addResult('newsecret', {
        status: response.status,
        requestData: { ...testData, clientSecret: '[REDACTED]' },
        responseData: data,
        success: response.ok
      }, response.ok ? 'success' : 'error');
      
    } catch (error) {
      addResult('newsecret', {
        error: error.message,
        success: false
      }, 'error');
    } finally {
      setLoadingState('newsecret', false);
    }
  };

  // Test 4: Create new connection
  const testCreateConnection = async () => {
    setLoadingState('create', true);
    
    const testData = {
      name: 'Debug Test Connection',
      type: 'PINGONE',
      clientId: '725210fd-3e86-449e-b992-27621e50b76a',
      clientSecret: 'test-client-secret',
      environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72',
      region: 'NA'
    };
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      addResult('create', {
        status: response.status,
        requestData: { ...testData, clientSecret: '[REDACTED]' },
        responseData: data,
        success: response.ok
      }, response.ok ? 'success' : 'error');
      
    } catch (error) {
      addResult('create', {
        error: error.message,
        success: false
      }, 'error');
    } finally {
      setLoadingState('create', false);
    }
  };

  const renderResult = (test, result) => {
    if (!result) return null;
    
    const bgColor = result.type === 'success' ? 'bg-green-50 border-green-200' :
                   result.type === 'error' ? 'bg-red-50 border-red-200' :
                   'bg-blue-50 border-blue-200';
    
    const textColor = result.type === 'success' ? 'text-green-800' :
                     result.type === 'error' ? 'text-red-800' :
                     'text-blue-800';
    
    return (
      <div className={`mt-4 p-4 rounded-md border ${bgColor} ${textColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">
            {result.success ? '✅' : '❌'} Status: {result.status || 'N/A'}
          </span>
          <span className="text-xs opacity-70">
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        {result.error && (
          <div className="mb-2">
            <strong>Error:</strong> {result.error}
          </div>
        )}
        
        {result.requestData && (
          <details className="mb-2">
            <summary className="cursor-pointer font-medium">Request Data</summary>
            <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto">
              {JSON.stringify(result.requestData, null, 2)}
            </pre>
          </details>
        )}
        
        {result.responseData && (
          <details>
            <summary className="cursor-pointer font-medium">Response Data</summary>
            <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto">
              {JSON.stringify(result.responseData, null, 2)}
            </pre>
          </details>
        )}
        
        {result.data && (
          <details>
            <summary className="cursor-pointer font-medium">Data</summary>
            <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🔧 Connection Update Debug Tool
        </h1>
        <p className="text-gray-600">
          This tool will help debug your connection update issues step by step.
        </p>
      </div>

      <div className="space-y-6">
        {/* Test 1: API Endpoint */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">1. Test API Endpoint</h3>
          <p className="text-sm text-gray-600 mb-3">
            Check if GET /api/connections/pingone-default works
          </p>
          <button
            onClick={testApiEndpoint}
            disabled={loading.endpoint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading.endpoint ? 'Testing...' : 'Test GET Endpoint'}
          </button>
          {renderResult('endpoint', results.endpoint)}
        </div>

        {/* Test 2: Update Connection */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">2. Test Connection Update</h3>
          <p className="text-sm text-gray-600 mb-3">
            Test PUT /api/connections/pingone-default with clientSecret: '[SAVED]'
          </p>
          <button
            onClick={testConnectionUpdate}
            disabled={loading.update}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading.update ? 'Testing...' : 'Test Update (Preserve Secret)'}
          </button>
          {renderResult('update', results.update)}
        </div>

        {/* Test 3: Update with New Secret */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">3. Test Update with New Secret</h3>
          <p className="text-sm text-gray-600 mb-3">
            Test PUT with a new client secret value
          </p>
          <button
            onClick={testWithNewSecret}
            disabled={loading.newsecret}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading.newsecret ? 'Testing...' : 'Test Update (New Secret)'}
          </button>
          {renderResult('newsecret', results.newsecret)}
        </div>

        {/* Test 4: Create Connection */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">4. Test Create Connection</h3>
          <p className="text-sm text-gray-600 mb-3">
            Test POST /api/connections to create a new connection
          </p>
          <button
            onClick={testCreateConnection}
            disabled={loading.create}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading.create ? 'Testing...' : 'Test Create Connection'}
          </button>
          {renderResult('create', results.create)}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">🎯 Next Steps Based on Results:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• If Test 1 fails → Check if /pages/api/connections/[id].js exists</li>
          <li>• If Test 2 returns 401 → Check authentication/authorization middleware</li>
          <li>• If Test 2 returns 500 → Check server console for error details</li>
          <li>• If Test 3 works but Test 2 fails → Issue with client secret handling</li>
          <li>• If all tests fail → Next.js server might not be running properly</li>
        </ul>
      </div>

      {/* Browser Console Instructions */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">🕵️ Browser Console Debugging</h4>
        <p className="text-sm text-yellow-700 mb-2">
          Open browser dev tools (F12) and check console for detailed logs. You can also test manually:
        </p>
        <code className="text-xs bg-yellow-100 p-2 rounded block">
          {`fetch('/api/connections/pingone-default', {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: 'Manual Test'})}).then(r => r.json()).then(console.log)`}
        </code>
      </div>
    </div>
  );
}