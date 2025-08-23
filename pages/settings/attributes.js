/ pages/settings/attributes.js - PingOne Connection Settings
import { useState, useEffect } from 'react';
import { Save, TestTube, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function AttributesSettings() {
  const [pingOneConfig, setPingOneConfig] = useState({
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    environmentId: '',
    region: 'NA'
  });

  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    // Load existing configuration
    loadPingOneConfig();
  }, []);

  const loadPingOneConfig = async () => {
    try {
      const response = await fetch('/api/settings/pingone');
      if (response.ok) {
        const config = await response.json();
        setPingOneConfig(config);
      }
    } catch (error) {
      console.error('Failed to load PingOne configuration:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setPingOneConfig(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset connection status when config changes
    setConnectionStatus(null);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('/api/settings/pingone/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pingOneConfig)
      });

      const result = await response.json();
      
      if (response.ok) {
        setConnectionStatus({
          success: true,
          message: 'Connection successful!',
          details: result
        });
      } else {
        setConnectionStatus({
          success: false,
          message: result.error || 'Connection failed',
          details: result
        });
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Connection test failed',
        details: { error: error.message }
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch('/api/settings/pingone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pingOneConfig)
      });

      if (response.ok) {
        setSaveStatus({
          success: true,
          message: 'Configuration saved successfully!'
        });
      } else {
        const error = await response.json();
        setSaveStatus({
          success: false,
          message: error.error || 'Failed to save configuration'
        });
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message: 'Failed to save configuration'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const regions = [
    { value: 'NA', label: 'North America', authUrl: 'https://auth.pingone.com', tokenUrl: 'https://api.pingone.com' },
    { value: 'EU', label: 'Europe', authUrl: 'https://auth.pingone.eu', tokenUrl: 'https://api.pingone.eu' },
    { value: 'APAC', label: 'Asia Pacific', authUrl: 'https://auth.pingone.asia', tokenUrl: 'https://api.pingone.asia' }
  ];

  const handleRegionChange = (region) => {
    const selectedRegion = regions.find(r => r.value === region);
    if (selectedRegion) {
      setPingOneConfig(prev => ({
        ...prev,
        region: region,
        authorizationUrl: `${selectedRegion.authUrl}/${prev.environmentId}/as/authorize`,
        tokenUrl: `${selectedRegion.tokenUrl}/v1/environments/${prev.environmentId}/as/token`
      }));
    }
  };

  const handleEnvironmentIdChange = (environmentId) => {
    const selectedRegion = regions.find(r => r.value === pingOneConfig.region);
    if (selectedRegion) {
      setPingOneConfig(prev => ({
        ...prev,
        environmentId,
        authorizationUrl: `${selectedRegion.authUrl}/${environmentId}/as/authorize`,
        tokenUrl: `${selectedRegion.tokenUrl}/v1/environments/${environmentId}/as/token`
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">PingOne Connection Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure PingOne Client Credentials for user management and API access.
        </p>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          {/* Region Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={pingOneConfig.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map(region => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          {/* Environment ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment ID *
            </label>
            <input
              type="text"
              value={pingOneConfig.environmentId}
              onChange={(e) => handleEnvironmentIdChange(e.target.value)}
              placeholder="12345678-abcd-1234-abcd-123456789012"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your PingOne Environment ID from the admin console
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID *
              </label>
              <input
                type="text"
                value={pingOneConfig.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                placeholder="Application Client ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret *
              </label>
              <div className="relative">
                <input
                  type={showClientSecret ? 'text' : 'password'}
                  value={pingOneConfig.clientSecret}
                  onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                  placeholder="Application Client Secret"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Authorization URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authorization URL
            </label>
            <input
              type="url"
              value={pingOneConfig.authorizationUrl}
              onChange={(e) => handleInputChange('authorizationUrl', e.target.value)}
              placeholder="https://auth.pingone.com/{environmentId}/as/authorize"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated based on region and environment ID
            </p>
          </div>

          {/* Token URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token URL
            </label>
            <input
              type="url"
              value={pingOneConfig.tokenUrl}
              onChange={(e) => handleInputChange('tokenUrl', e.target.value)}
              placeholder="https://api.pingone.com/v1/environments/{environmentId}/as/token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated based on region and environment ID
            </p>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <div className={`p-4 rounded-md ${connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {connectionStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <p className={`text-sm font-medium ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                  {connectionStatus.message}
                </p>
              </div>
              {connectionStatus.details && (
                <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(connectionStatus.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Save Status */}
          {saveStatus && (
            <div className={`p-4 rounded-md ${saveStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {saveStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <p className={`text-sm font-medium ${saveStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                  {saveStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={testConnection}
              disabled={isTestingConnection || !pingOneConfig.clientId || !pingOneConfig.clientSecret}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={saveConfiguration}
              disabled={isSaving || !pingOneConfig.clientId || !pingOneConfig.clientSecret}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Grant Type Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Client Credentials Grant Type</h4>
          <p className="text-sm text-blue-700">
            This configuration uses the OAuth 2.0 Client Credentials grant type for server-to-server authentication. 
            Ensure your PingOne application is configured with the following:
          </p>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Grant Type: Client Credentials</li>
            <li>Scopes: Required scopes for user management (e.g., p1:read:user, p1:create:user)</li>
            <li>Token Endpoint Authentication: Client Secret Post or Client Secret Basic</li>
          </ul>
        </div>
      </div>
    </div>
  );
}