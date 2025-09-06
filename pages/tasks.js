// Create file: /pages/tasks.js
import { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Tasks</h1>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Loading tasks...</span>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map(task => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(task.status)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {task.task_type} Import - {task.connection_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Started {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {task.status === 'running' && (
                        <div className="text-sm text-gray-500">
                          {task.progress}% ({task.processed_records}/{task.total_records})
                        </div>
                      )}
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'failed' ? 'bg-red-100 text-red-800' :
                        task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </div>
                    </div>
                  </div>
                  
                  {task.status === 'completed' && (
                    <div className="mt-2 text-sm text-gray-500">
                      Created: {task.created_records}, Updated: {task.updated_records}, Failed: {task.failed_records}
                    </div>
                  )}
                  
                  {task.error_message && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {task.error_message}
                    </div>
                  )}
                  
                  {task.status === 'running' && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No import tasks found</h3>
              <p className="text-gray-600">Import tasks will appear here when you start user imports.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}