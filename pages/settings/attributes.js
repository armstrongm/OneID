// pages/settings/attributes.js - PingOne Settings with Endpoint Selection
import { useState, useEffect } from 'react';
import { Save, TestTube, Eye, EyeOff, AlertCircle, CheckCircle, Globe, Key, Users } from 'lucide-react';

export default function AttributesSettings() {
  const [pingOneConfig, setPingOneConfig] = useState({
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    usersApiUrl: '',
    environmentId: '',
    region: 'NA'
  });

  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Pre-defined endpoint templates for different scenarios
  const endpointTemplates = {
    // Standard PingOne endpoints
    pingone_na: {
      label: "PingOne - North America",
      authUrl: "https://auth.pingone.com/{environmentId}/as/authorize",
      tokenUrl: "https://api.pingone.com/v1/environments/{environmentId}/as/token",
      usersUrl: "https://api.pingone.com/v1/environments/{environmentId}/users"
    },
    pingone_eu: {
      label: "PingOne - Europe", 
      authUrl: "https://auth.pingone.eu/{environmentId}/as/authorize",
      tokenUrl: "https://api.pingone.eu/v1/environments/{environmentId}/as/token",
      usersUrl: "https://api.pingone.eu/v1/environments/{environmentId}/users"
    },
    pingone_apac: {
      label: "PingOne - Asia Pacific",
      authUrl: "https://auth.pingone.asia/{environmentId}/as/authorize", 
      tokenUrl: "https://api.pingone.asia/v1/environments/{environmentId}/as/token",
      usersUrl: "https://api.pingone.asia/v1/environments/{environmentId}/users"
    },
    // PingOne DaVinci (sometimes different)
    pingone_davinci_na: {
      label: "PingOne DaVinci - North America",
      authUrl: "https://auth.pingone.com/{environmentId}/as/authorize",
      tokenUrl: "https://orchestrate-api.pingone.com/v1/company/{companyId}/sdkToken",
      usersUrl: "https://api.pingone.com/v1/environments/{environmentId}/users"
    },
    // Custom option
    custom: {
      label: "Custom Endpoints",
      authUrl: "",
      tokenUrl: "",
      usersUrl: ""
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState('pingone_na');

  useEffect(() => {
    loadPingOneConfig();
  }, []);

  const loadPingOneConfig = async () => {
    try {
      const response = await fetch('/api/settings/pingone');
      if (response.ok) {
        const config = await response.json();
        setPingOneConfig(config);
        
        // Try to detect which template is being used
        if (config.tokenUrl) {
          detectTemplate(config.tokenUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load PingOne configuration:', error);
    }
  };

  const detectTemplate = (tokenUrl) => {
    if (tokenUrl.includes('api.pingone.com')) {
      setSelectedTemplate('pingone_na');
    } else if (tokenUrl.includes('api.pingone.eu')) {
      setSelectedTemplate('pingone_eu');
    } else if (tokenUrl.includes('api.pingone.asia')) {
      setSelectedTemplate('pingone_apac');
    } else if (tokenUrl.includes('orchestrate-api.pingone.com')) {
      setSelectedTemplate('pingone_davinci_na');
    } else {
      setSelectedTemplate('custom');
    }
  };

  const handleInputChange = (field, value) => {
    setPingOneConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Reset status when config changes
    setConnectionStatus(null);
    setSaveStatus(null);
  };

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    
    if (templateKey === 'custom') {
      // Don't auto-populate for custom
      return;
    }

    const template = endpointTemplates[templateKey];
    const { environmentId } = pingOneConfig;

    if (environmentId && template) {
      const newConfig = {
        authorizationUrl: template.authUrl.replace('{environmentId}', environmentId),
        tokenUrl: template.tokenUrl.replace('{environmentId}', environmentId),
        usersApiUrl: template.usersUrl.replace('{environmentId}', environmentId)
      };

      setPingOneConfig(prev => ({
        ...prev,
        ...newConfig
      }));

      console.log('🔗 Applied template:', templateKey, newConfig);
    }
  };

  const handleEnvironmentIdChange = (environmentId) => {
    handleInputChange('environmentId', environmentId);
    
    // Auto-update URLs when environment ID changes
    if (selectedTemplate !== 'custom' && environmentId) {
      const template = endpointTemplates[selectedTemplate];
      if (template) {
        const newConfig = {
          authorizationUrl: template.authUrl.replace('{environmentId}', environmentId),
          tokenUrl: template.tokenUrl.replace('{environmentId}', environmentId), 
          usersApiUrl: template.usersUrl.replace('{environmentId}', environmentId)
        };

        setPingOneConfig(prev => ({
          ...prev,
          ...newConfig
        }));
      }
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      console.log('🧪 Testing PingOne connection with endpoints:', {
        clientId: pingOneConfig.clientId ? `${pingOneConfig.clientId.substring(0, 8)}...` : 'missing',
        environmentId: pingOneConfig.environmentId,
        tokenUrl: pingOneConfig.tokenUrl,
        usersUrl: pingOneConfig.usersApiUrl
      });

      const response = await fetch('/api/settings/pingone/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: pingOneConfig.clientId,
          clientSecret: pingOneConfig.clientSecret,
          tokenUrl: pingOneConfig.tokenUrl,
          environmentId: pingOneConfig.environmentId,
          usersApiUrl: pingOneConfig.usersApiUrl,
          region: pingOneConfig.region
        })
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">PingOne Connection Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure PingOne Client Credentials and API endpoints for user management.
        </p>

        <div className="space-y-6">
          {/* Endpoint Template Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center mb-3">
              <Globe className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-800">API Endpoint Configuration</h4>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Select Endpoint Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.entries(endpointTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-1">
                This will automatically populate the correct API endpoints for your region
              </p>
            </div>
          </div>

          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Environment ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment ID *
              </label>
              <input
                type="text"
                value={pingOneConfig.environmentId}
                onChange={(e) => handleEnvironmentIdChange(e.target.value)}
                placeholder="83d2def8-b21f-4e7a-a9e9-f59a08caabcb"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in PingOne Admin Console → Environment → Properties
              </p>
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID *
              </label>
              <input
                type="text"
                value={pingOneConfig.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                placeholder="800bf5cc-a3e9-4f15-986a-32f3445e1384"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Client Secret */}
            <div className="md:col-span-2">
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

          {/* API Endpoints */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center mb-2">
              <Key className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">API Endpoints</h4>
            </div>

            {/* Authorization URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authorization URL *
              </label>
              <input
                type="url"
                value={pingOneConfig.authorizationUrl}
                onChange={(e) => handleInputChange('authorizationUrl', e.target.value)}
                placeholder="https://auth.pingone.com/{environmentId}/as/authorize"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={selectedTemplate !== 'custom'}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for OAuth authorization flows
              </p>
            </div>

            {/* Token URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token URL *
              </label>
              <input
                type="url"
                value={pingOneConfig.tokenUrl}
                onChange={(e) => handleInputChange('tokenUrl', e.target.value)}
                placeholder="https://api.pingone.com/v1/environments/{environmentId}/as/token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={selectedTemplate !== 'custom'}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for client credentials token exchange
              </p>
            </div>

            {/* Users API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Users API URL *
              </label>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="url"
                  value={pingOneConfig.usersApiUrl}
                  onChange={(e) => handleInputChange('usersApiUrl', e.target.value)}
                  placeholder="https://api.pingone.com/v1/environments/{environmentId}/users"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={selectedTemplate !== 'custom'}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for user management operations
              </p>
            </div>
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
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600">View Details</summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                    {JSON.stringify(connectionStatus.details, null, 2)}
                  </pre>
                </details>
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
              disabled={isTestingConnection || !pingOneConfig.clientId || !pingOneConfig.clientSecret || !pingOneConfig.environmentId || !pingOneConfig.tokenUrl}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={saveConfiguration}
              disabled={isSaving || !pingOneConfig.clientId || !pingOneConfig.clientSecret || !pingOneConfig.environmentId}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Help Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Endpoint Selection Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li><strong>PingOne - North America:</strong> Most common, use if your PingOne environment is in the US/Canada</li>
              <li><strong>PingOne - Europe:</strong> Use if your environment is hosted in Europe</li>
              <li><strong>PingOne - Asia Pacific:</strong> Use if your environment is in Asia/Australia</li>
              <li><strong>Custom:</strong> If you have specialized endpoints or are using a different PingOne setup</li>
            </ul>
          </div>

          {/* PingOne App Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">⚙️ PingOne Application Requirements</h4>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li><strong>Grant Type:</strong> Client Credentials</li>
              <li><strong>Required Scopes:</strong> p1:read:user, p1:create:user, p1:update:user, p1:delete:user, p1:read:environment</li>
              <li><strong>Token Endpoint Authentication:</strong> Client Secret Post or Client Secret Basic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}