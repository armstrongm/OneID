// components/import/ImportPreviewModal.jsx
import { useState, useEffect } from 'react';
import { X, Upload, Eye, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function ImportPreviewModal({ 
  connectionId, 
  isOpen, 
  onClose, 
  onImport 
}) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen && connectionId) {
      fetchPreview();
    }
  }, [isOpen, connectionId]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    
    try {
      console.log('Fetching preview for connection:', connectionId);
      
      const response = await fetch(`/api/connections/${connectionId}/import-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      console.log('Preview response:', data);
      
      if (data.success) {
        setPreview(data);
        // Initialize field mapping with auto-detected fields
        const mapping = {};
        data.analysis.detectedFields.forEach(field => {
          const lowerField = field.toLowerCase();
          // Auto-map common fields
          if (lowerField.includes('email')) {
            mapping[field] = 'email';
          } else if (lowerField.includes('username') || lowerField.includes('login')) {
            mapping[field] = 'username';
          } else if (lowerField.includes('first') && lowerField.includes('name')) {
            mapping[field] = 'first_name';
          } else if (lowerField.includes('last') && lowerField.includes('name')) {
            mapping[field] = 'last_name';
          } else if (lowerField.includes('name') && !lowerField.includes('username')) {
            mapping[field] = 'display_name';
          } else if (lowerField.includes('phone')) {
            mapping[field] = 'phone_number';
          } else if (lowerField.includes('title')) {
            mapping[field] = 'title';
          } else if (lowerField.includes('department')) {
            mapping[field] = 'department';
          } else {
            mapping[field] = ''; // Skip by default
          }
        });
        setFieldMapping(mapping);
      } else {
        setError(data.error || 'Failed to fetch preview');
      }
    } catch (err) {
      console.error('Preview fetch error:', err);
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (dryRun = false) => {
    setImporting(true);
    try {
      const response = await fetch(`/api/connections/${connectionId}/import-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, fieldMapping })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onImport(data);
        if (!dryRun) {
          onClose();
        }
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError(err.message || 'Import request failed');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Import Preview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span>Loading preview...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button 
              onClick={fetchPreview}
              className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {preview && (
          <div className="space-y-6">
            {/* Import Summary */}
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Import Summary</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-medium ml-1">{preview.analysis.totalRecords}</span>
                </div>
                <div>
                  <span className="text-gray-600">Preview Records:</span>
                  <span className="font-medium ml-1">{preview.analysis.previewRecords}</span>
                </div>
                <div>
                  <span className="text-gray-600">Detected Fields:</span>
                  <span className="font-medium ml-1">{preview.analysis.detectedFields.length}</span>
                </div>
              </div>
            </div>

            {/* Field Mapping */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Field Mapping</h4>
              <p className="text-sm text-gray-600 mb-3">
                Map the source fields to user attributes. Leave blank to skip a field.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                {preview.analysis.detectedFields.map(field => (
                  <div key={field} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-32 truncate font-mono">
                      {field}:
                    </span>
                    <select
                      value={fieldMapping[field] || ''}
                      onChange={(e) => setFieldMapping(prev => ({
                        ...prev,
                        [field]: e.target.value
                      }))}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Skip Field</option>
                      <option value="username">Username</option>
                      <option value="email">Email</option>
                      <option value="first_name">First Name</option>
                      <option value="last_name">Last Name</option>
                      <option value="display_name">Display Name</option>
                      <option value="title">Title</option>
                      <option value="department">Department</option>
                      <option value="phone_number">Phone Number</option>
                      <option value="mobile_number">Mobile Number</option>
                      <option value="employee_id">Employee ID</option>
                      <option value="office_location">Office Location</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Data */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preview Data (First {preview.analysis.previewRecords} records)</h4>
              <div className="overflow-x-auto border border-gray-300 rounded-md">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.analysis.detectedFields.map(field => (
                        <th key={field} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          <div className="flex flex-col">
                            <span>{field}</span>
                            {fieldMapping[field] && (
                              <span className="text-blue-600 normal-case mt-1">
                                → {fieldMapping[field]}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.preview.map((record, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {preview.analysis.detectedFields.map(field => (
                          <td key={field} className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                            {record[field] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={onClose}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleImport(true)}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  {importing ? 'Testing...' : 'Dry Run'}
                </button>
                
                <button
                  onClick={() => handleImport(false)}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  {importing ? 'Importing...' : `Import ${preview.analysis.totalRecords} Users`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}