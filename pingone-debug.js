// pages/pingone-debug.js - PingOne Diagnostic Tool as Next.js Page
import { useState } from 'react';
import Head from 'next/head';

export default function PingOneDebug() {
  const [environmentId, setEnvironmentId] = useState('83d2def8-b21f-4e7a-a9e9-f59a08caabcb');
  const [clientId, setClientId] = useState('800bf5cc-a3e9-4f15-986a-32fc445e1384');
  const [clientSecret, setClientSecret] = useState('');
  const [results, setResults] = useState([]);

  const addResult = (title, content, type = 'info') => {
    const bgClass = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                   type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                   type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                   'bg-blue-50 border-blue-200 text-blue-800';
    
    const newResult = {
      id: Date.now(),
      title,
      content,
      className: `bg-white rounded-lg shadow p-4 ${bgClass} border`
    };

    setResults(prev => [...prev, newResult]);
  };

  const testDirectPingOne = async () => {
    if (!clientSecret) {
      addResult('❌ Missing Client Secret', 'Please enter your client secret first', 'error');
      return;
    }

    // Test direct call to PingOne (bypassing your API)
    const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
    
    addResult('🔄 Testing Direct PingOne Call', `Making direct call to: ${tokenUrl}`, 'info');

    try {
      const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment'
      });

      const authHeader = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      const result = await response.text();
      
      if (response.ok) {
        addResult('✅ Direct PingOne Success', `Status: ${response.status}\nResponse: ${result}`, 'success');
      } else {
        if (result.includes('Authorization header requires')) {
          addResult('❌ AWS Error in Direct Call!', `This means your DNS or network is redirecting PingOne requests to AWS!\n\nStatus: ${response.status}\nResponse: ${result}\n\nURL called: ${tokenUrl}\n\n🚨 SOLUTION: This is a network/DNS issue, not a code issue!`, 'error');
        } else {
          addResult('⚠️ Direct PingOne Error', `Status: ${response.status}\nResponse: ${result}`, 'warning');
        }
      }
    } catch (error) {
      addResult('❌ Direct Call Network Error', `Error: ${error.message}\n\nThis suggests a network connectivity issue.`, 'error');
    }
  };

  const testViaYourAPI = async () => {
    if (!clientSecret) {
      addResult('❌ Missing Client Secret', 'Please enter your client secret first', 'error');
      return;
    }

    addResult('🔄 Testing Via Your API', 'Making call to /api/settings/pingone/test', 'info');

    try {
      const response = await fetch('/api/settings/pingone/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environmentId,
          clientId,
          clientSecret,
          tokenUrl: `https://auth.pingone.com/${environmentId}/as/token`,
          region: 'NA'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addResult('✅ Your API Success', JSON.stringify(result, null, 2), 'success');
      } else {
        addResult('❌ Your API Error', `Status: ${response.status}\n${JSON.stringify(result, null, 2)}`, 'error');
      }
    } catch (error) {
      addResult('❌ Your API Network Error', `Error: ${error.message}\n\nYour API endpoint might not exist or is not responding.`, 'error');
    }
  };

  const testSimpleAPI = async () => {
    if (!clientSecret) {
      addResult('❌ Missing Client Secret', 'Please enter your client secret first', 'error');
      return;
    }

    addResult('🔄 Testing Simple API', 'Making call to /api/settings/pingone/simple-test', 'info');

    try {
      const response = await fetch('/api/settings/pingone/simple-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environmentId,
          clientId,
          clientSecret
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addResult('✅ Simple API Success', JSON.stringify(result, null, 2), 'success');
      } else {
        if (result.error === 'AWS_ENDPOINT_DETECTED') {
          addResult('🚨 AWS Redirect Detected!', `${result.message}\n\nDebug Info:\n${JSON.stringify(result.debug, null, 2)}`, 'error');
        } else {
          addResult('❌ Simple API Error', `Status: ${response.status}\n${JSON.stringify(result, null, 2)}`, 'error');
        }
      }
    } catch (error) {
      addResult('❌ Simple API Network Error', `Error: ${error.message}\n\nThe simple-test API endpoint might not exist.`, 'error');
    }
  };

  const debugAllEndpoints = async () => {
    addResult('🔍 Debug Information', 'Starting comprehensive endpoint debugging...', 'info');
    
    // Test different URL patterns
    const urlsToTest = [
      `https://auth.pingone.com/${environmentId}/as/token`,
      `https://api.pingone.com/v1/environments/${environmentId}/as/token`,
      `https://auth.pingone.eu/${environmentId}/as/token`,
      `https://auth.pingone.asia/${environmentId}/as/token`
    ];

    for (const url of urlsToTest) {
      addResult(`🔗 Testing URL: ${url}`, 'Checking if URL is accessible...', 'info');
      
      try {
        // Just test if we can reach the endpoint (without auth)
        const response = await fetch(url, { 
          method: 'OPTIONS',
          mode: 'cors'
        });
        addResult(`✅ URL Reachable: ${url}`, `Status: ${response.status}`, 'success');
      } catch (error) {
        if (error.message.includes('CORS')) {
          addResult(`⚠️ CORS Issue: ${url}`, `URL is reachable but has CORS restrictions: ${error.message}`, 'warning');
        } else {
          addResult(`❌ URL Not Reachable: ${url}`, error.message, 'error');
        }
      }
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <>
      <Head>
        <title>PingOne AWS Error Diagnostic</title>
      </Head>
      
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6 text-red-600">🔧 PingOne AWS Error Diagnostic</h1>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h2 className="text-sm font-medium text-red-800 mb-2">❌ AWS Error Detected</h2>
              <p className="text-sm text-red-700">
                Your request is going to AWS instead of PingOne. This tool will help us find out why.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment ID</label>
                <input 
                  type="text" 
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                <input 
                  type="password" 
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your client secret"
                  className="w-full px-3 py-2 border rounded-md" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={testDirectPingOne} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test Direct PingOne
                </button>
                <button 
                  onClick={testViaYourAPI} 
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Test Via Your API
                </button>
                <button 
                  onClick={testSimpleAPI} 
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Test Simple API
                </button>
                <button 
                  onClick={debugAllEndpoints} 
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Debug Endpoints
                </button>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Clear Results
                </button>
              </div>
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
        </div>
      </div>
    </>
  );
}