'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/lib/types';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/tasks';
import { logout } from '@/lib/auth';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoadTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        try {
          const data = await getTasks();
          setTasks(data);
        } catch (err) {
          setError('Failed to load tasks');
        }
      } catch (error) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadTasks();
  }, [router]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      const newTask = await createTask({ title, description });
      setTasks([...tasks, newTask]);
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTaskCompletion = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updatedTask = await updateTask(id, {
        completed: !task.completed
      });

      setTasks(tasks.map(t =>
        t.id === id ? updatedTask : t
      ));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const focusScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 font-mono">LOADING WORKSPACE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-black/20 backdrop-blur-xl border-r border-cyan-500/20 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <div className="p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {sidebarOpen && (
          <div className="px-4 space-y-2">
            <div className="text-xs font-mono text-cyan-400 mb-4">WORKSPACE</div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-500">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span className="text-sm font-medium">Tasks</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              logout();
              router.push('/auth/login');
            }}
            className="w-full px-3 py-2 text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
          >
            {sidebarOpen ? 'DISCONNECT' : 'DC'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-16'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Todo App
          </h1>
        </div>

        {/* Dashboard Widgets */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-slate-400">TOTAL WORKLOAD</div>
                <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/50"></div>
              </div>
              <div className="text-2xl font-bold text-white">{totalTasks}</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-green-500/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-slate-400">COMPLETED ACTIONS</div>
                <div className="w-2 h-2 rounded-full bg-green-400 group-hover:shadow-lg group-hover:shadow-green-400/50"></div>
              </div>
              <div className="text-2xl font-bold text-white">{completedTasks}</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-slate-400">OPEN ITEMS</div>
                <div className="w-2 h-2 rounded-full bg-orange-400 group-hover:shadow-lg group-hover:shadow-orange-400/50"></div>
              </div>
              <div className="text-2xl font-bold text-white">{totalTasks - completedTasks}</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-slate-400">FOCUS SCORE</div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-400/50"></div>
              </div>
              <div className="text-2xl font-bold text-white">{focusScore}%</div>
            </div>
          </div>

          {/* Command Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 pl-10 text-sm focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              CREATE TASK
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm font-mono">{error}</p>
            </div>
          )}

          {/* Task Grid */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-mono text-sm">NO ACTIVE TASKS</p>
                <p className="text-slate-500 text-xs mt-1">Initialize your first task to begin</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="flex-shrink-0"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/25' 
                          : 'border-slate-500 hover:border-cyan-400'
                      }`}>
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium mb-1 ${
                        task.completed ? 'line-through text-slate-500' : 'text-white'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm ${
                          task.completed ? 'line-through text-slate-600' : 'text-slate-300'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          task.completed ? 'bg-green-400' : 'bg-orange-400'
                        }`}></div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-white mb-4">CREATE NEW TASK</h2>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
                  placeholder="Description (optional)"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium py-3 rounded-lg transition-all"
                >
                  {isCreating ? 'CREATING...' : 'CREATE'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 font-medium py-3 rounded-lg transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
