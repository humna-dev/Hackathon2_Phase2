'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get('/api/tasks');
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await apiClient.post('/api/tasks', {
        title,
        description,
        completed: false
      });
      
      setTasks([...tasks, response.data]);
      setTitle('');
      setDescription('');
      setError('');
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const toggleTaskCompletion = async (id: number) => {
    try {
      const response = await apiClient.patch(`/api/tasks/${id}/complete`);
      
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, completed: response.data.completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Todo Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Task</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {String(error)}
              </div>
            )}
            <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task description (optional)"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Task
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Tasks</h2>
            {tasks.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">No tasks yet. Create your first task above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white p-6 rounded-lg shadow-md ${
                      task.completed ? 'bg-green-50 border-l-4 border-green-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3
                        className={`text-lg font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`ml-2 px-3 py-1 text-xs rounded ${
                          task.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {task.completed ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-gray-600">{task.description}</p>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}