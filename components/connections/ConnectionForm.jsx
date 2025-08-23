// components/connections/ConnectionForm.jsx
import { useState, useEffect } from 'react';
import { Eye, EyeOff, TestTube, Save, X } from 'lucide-react';

const CONNECTION_TYPES = {
  AD: {
    label: 'Active Directory',
    icon: '🏢',
    fields: [
      { key: 'serverName', label: 'Server Name/IP', type: 'text', required: true, placeholder: 'dc01.company.com' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '389', defaultValue: 389 },
      { key: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'company.com' },
      { key: 'baseDN', label: 'Base DN', type: 'text', required: true, placeholder: 'DC=company,DC=com' },
      { key: 'username', label: 'Service Account Username', type: 'text', required: true, placeholder: 'serviceaccount@company.com' },
      { key: 'password', label: 'Service Account Password', type: 'password', required: true },
      { key: 'useSSL', label: 'Use SSL/TLS', type: 'checkbox', defaultValue: true },
      { key: 'timeout', label: 'Connection Timeout (seconds)', type: 'number', defaultValue: 30 }
    ]
  },
  LDAP: {
    label: 'LDAP Server',
    icon: '📁',
    fields: [
      { key: 'serverName', label: 'Server Name/IP', type: 'text', required: true, placeholder: 'ldap.company.com' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '389', defaultValue: 389 },
      { key: 'baseDN', label: 'Base DN', type: 'text', required: true, placeholder: 'dc=company,dc=com' },
      { key: 'bindDN', label: 'Bind DN', type: 'text', required: true, placeholder: 'cn=admin,dc=company,dc=com' },
      { key: 'password', label: 'Bind Password', type: 'password', required: true },
      { key: 'useSSL', label: 'Use SSL/TLS', type: 'checkbox', defaultValue: false },
      { key: 'timeout', label: 'Connection Timeout (seconds)', type: 'number', defaultValue: 30 }
    ]
  },
  DATABASE: {
    label: 'PostgreSQL Database',
    icon: '🗄️',
    fields: [
      { key: 'serverName', label: 'Server Name/IP', type: 'text', required: true, placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '5432', defaultValue: 5432 },
      { key: 'database', label: 'Database Name', type: 'text', required: true, placeholder: 'identity_db' },
      { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'db_user' },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'useSSL', label: 'Use SSL', type: 'checkbox', defaultValue: true },
      { key: 'maxConnections', label: 'Max Connections', type: 'number', defaultValue: 10 }
    ]
  }
};

export default function ConnectionForm({ 
  connection = null, 
  connectionType = 'AD', 
  onSubmit, 
  onCancel, 
  onTest,
  loading = false,
  testResult = null 
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [testing, setTesting] = useState(false);

  const connectionConfig = CONNECTION_TYPES[connectionType];

  useEffect(() => {
    // Initialize form data with default values
    const initialData = { type: connectionType };
    
    connectionConfig.fields.forEach(field => {
      if (connection && connection[field.key] !== undefined) {
        initialData[field.key] = connection[field.key];
      } else if (field.defaultValue !== undefined) {
        initialData[field.key] = field.defaultValue;
      } else {
        initialData[field.key] = field.type === 'checkbox' ? false : '';
      }
    });

    if (connection) {
      initialData.id = connection.id;
      initialData.name = connection.name || '';
      initialData.description = connection.description || '';
    }

    setFormData(initialData);
  }, [connection, connectionType, connectionConfig]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Connection name is required';
    }

    connectionConfig.fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleTest = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setTesting(true);
    await onTest(formData);
    setTesting(false);
  };

  const togglePasswordVisibility = (fieldKey) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Connection Header */}
      <div className="flex items-center space-x-3 pb-4 border-b">
        <span className="text-2xl">{connectionConfig.icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {connection ? 'Edit' : 'Create'} {connectionConfig.label} Connection
          </h3>
          <p className="text-sm text-gray-600">
            Configure connection settings for {connectionConfig.label.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Connection Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="My AD Connection"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Production AD server"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Connection Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectionConfig.fields.map((field) => (
          <div key={field.key} className={field.type === 'checkbox' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            
            {field.type === 'checkbox' ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData[field.key] || false}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">{field.label}</span>
              </div>
            ) : field.type === 'password' ? (
              <div className="relative">
                <input
                  type={showPasswords[field.key] ? 'text' : 'password'}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.key] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field.key)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords[field.key] ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            ) : (
              <input
                type={field.type}
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[field.key] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            
            {errors[field.key] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Test Results */}
      {testResult && (
        <div className={`p-4 rounded-md ${
          testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
              {testResult.success ? '✅' : '❌'}
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </h4>
              <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message || testResult.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          type="button"
          onClick={handleTest}
          disabled={loading || testing}
          className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <TestTube className={`w-4 h-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : connection ? 'Update Connection' : 'Create Connection'}
          </button>
        </div>
      </div>
    </form>
  );
}