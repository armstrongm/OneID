// components/diagnostics/PingOneDiagnostic.jsx
import { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function PingOneDiagnostic({ config, onTest, testResult }) {
  const [showSecrets, setShowSecrets] = useState(false);
  const [copied, setCopied] = useState(null);

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatConfig = () => {
    if (!config) return null;

    const regionUrls = {
      'NA': { auth: 'https://auth.pingone.com', api: 'https://api.pingone.com' },
      'EU': { auth: 'https://auth.pingone.eu', api: 'https://api.pingone.eu' },
      'APAC': { auth: 'https://auth.pingone.asia', api: 'https://api.pingone.asia' }
    };

    const urls = regionUrls[config.region] || {};
    const tokenUrl = config.tokenUrl || (config.environmentId && urls.api 
      ? `${urls.api}/v1/environments/${config.environmentId}/as/token` 
      : '');
    const apiBaseUrl = config.apiBaseUrl || (config.environmentId && urls.api 
      ? `${urls.api}/v1/environments/${config.environmentId}`
      : '');

    return {
      ...config,
      tokenUrl,
      apiBaseUrl,
      authUrl: urls.auth,
      apiUrl: urls.api
    };
  };

  const formattedConfig = formatConfig();

  const renderConfigItem = (label, value, isSecret = false, copyValue = null) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-900 font-mono max-w-xs truncate">
          {isSecret && !showSecrets ? '••••••••••••' : value}
        </span>
        {copyValue && (
          <button
            onClick={() => copyToClipboard(copyValue, label)}
            className="text-gray-400 hover:text-gray-600"
            title="Copy to clipboard"
          >
            {copied === label ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const renderTestResult = (test) => {
    const icon = test.success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );

    return (
      <div key={test.name} className={`p-4 rounded-lg ${
        test.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-start space-x-3">
          {icon}
          <div className="flex-1">
            <h4 className={`text-sm font-medium ${
              test.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {test.name}
            </h4>
            <p className={`text-sm ${
              test.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {test.message}
            </p>
            {test.details && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                  Show details
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuration Review */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Configuration Review</h3>
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            {showSecrets ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showSecrets ? 'Hide' : 'Show'} Secrets
          </button>
        </div>

        {formattedConfig ? (
          <div className="space-y-1">
            {renderConfigItem('Environment ID', formattedConfig.environmentId?.substring(0, 8) + '...', false, formattedConfig.environmentId)}
            {renderConfigItem('Region', formattedConfig.region)}
            {renderConfigItem('Client ID', formattedConfig.clientId?.substring(0, 8) + '...', false, formattedConfig.clientId)}
            {renderConfigItem('Client Secret', formattedConfig.clientSecret, true, formattedConfig.clientSecret)}
            {renderConfigItem('Scopes', formattedConfig.scopes || 'Default')}
            {renderConfigItem('Token URL', formattedConfig.tokenUrl, false, formattedConfig.tokenUrl)}
            {renderConfigItem('API Base URL', formattedConfig.apiBaseUrl, false, formattedConfig.apiBaseUrl)}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No configuration provided</p>
        )}
      </div>

      {/* Test Connection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Connection Test</h3>
          <button
            onClick={() => onTest(formattedConfig)}
            disabled={!formattedConfig || (testResult?.testing)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${testResult?.testing ? 'animate-spin' : ''}`} />
            {testResult?.testing ? 'Testing...' : 'Run Test'}
          </button>
        </div>

        {testResult && (
          <div className="space-y-4">
            {testResult.testing ? (
              <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-blue-800">Testing connection...</span>
              </div>
            ) : (
              <>
                {/* Overall Result */}
                <div className={`p-4 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h4 className={`text-sm font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                      </h4>
                      <p className={`text-sm ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResult.overall || testResult.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Test Results */}
                {testResult.tests && testResult.tests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Test Details</h4>
                    {testResult.tests.map(renderTestResult)}
                  </div>
                )}

                {/* Error Details */}
                {testResult.error && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Error Details</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {typeof testResult.error === 'string' 
                        ? testResult.error 
                        : JSON.stringify(testResult.error, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Troubleshooting Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Troubleshooting Guide</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Common Issues:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Authentication Failed:</strong> Check client ID and client secret</li>
              <li><strong>Environment Not Found:</strong> Verify environment ID and region</li>
              <li><strong>Access Forbidden:</strong> Ensure application has required scopes</li>
              <li><strong>Network Errors:</strong> Check firewall and network connectivity</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Required PingOne Application Configuration:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Grant Type: <code className="bg-gray-100 px-1 rounded">Client Credentials</code></li>
              <li>Token Endpoint Authentication: <code className="bg-gray-100 px-1 rounded">Client Secret Post</code></li>
              <li>Required Scopes: <code className="bg-gray-100 px-1 rounded">p1:read:user p1:read:environment p1:create:user</code></li>
            </ul>
          </div>

          <div className="pt-2 border-t">
            <a
              href="https://docs.pingidentity.com/r/en-us/pingone/p1_c_applications"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              PingOne Application Configuration Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}