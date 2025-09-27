import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Calendar, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Task } from '../types/dashboard';

interface TaskManagerProps {
  selectedCustomerId: number;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  selectedCustomerId
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskAssignee, setEditTaskAssignee] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTaskId(taskId);
      setEditTaskTitle(task.title);
      setEditTaskAssignee(task.assignee || '');
      setEditTaskDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const taskData: any = {
        title: editTaskTitle.trim(),
        assignee: editTaskAssignee.trim()
      };
      
      if (editTaskDueDate && editTaskDueDate.trim()) {
        taskData.due_date = new Date(editTaskDueDate).toISOString();
      }

      const { error } = await supabase
        .from('customer_tasks')
        .update(taskData)
        .eq('id', editingTaskId);

      if (error) {
        console.error('Error updating task:', error);
        setError(error.message);
      } else {
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === editingTaskId 
            ? { ...t, title: editTaskTitle.trim(), assignee: editTaskAssignee.trim(), due_date: editTaskDueDate ? new Date(editTaskDueDate).toISOString() : null }
            : t
        ));
        handleCancelEdit();
      }
    } catch (err) {
      console.error('Exception updating task:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskAssignee('');
    setEditTaskDueDate('');
  };

  // Fetch tasks for the selected customer
  const fetchTasks = async () => {
    if (!selectedCustomerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('customer_tasks')
        .select('*')
        .eq('customer_id', selectedCustomerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        setError(error.message);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Exception fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when component mounts or customer changes
  useEffect(() => {
    fetchTasks();
  }, [selectedCustomerId]);

  const handleAddTask = async (title: string, assignee: string, dueDate?: string) => {
    if (!selectedCustomerId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const taskData: any = {
        customer_id: selectedCustomerId,
        title: title.trim(),
        assignee: assignee.trim(),
        completed: false
      };
      
      // Add due_date if provided
      if (dueDate && dueDate.trim()) {
        taskData.due_date = new Date(dueDate).toISOString();
      }

      const { data, error } = await supabase
        .from('customer_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        setError(error.message);
      } else {
        // Add the new task to the local state
        setTasks(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error('Exception adding task:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    setError(null);
    
    try {
      const { error } = await supabase
        .from('customer_tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

      if (error) {
        console.error('Error toggling task:', error);
        setError(error.message);
      } else {
        // Update the local state
        setTasks(prev => prev.map(t => 
          t.id === id ? { ...t, completed: !t.completed } : t
        ));
      }
    } catch (err) {
      console.error('Exception toggling task:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    setError(null);
    
    try {
      const { error } = await supabase
        .from('customer_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        setError(error.message);
      } else {
        // Remove the task from local state
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Exception deleting task:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && newTaskAssignee.trim()) {
      handleAddTask(newTaskTitle.trim(), newTaskAssignee.trim(), newTaskDueDate);
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setIsAddingTask(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">
            <strong>Fehler:</strong> {error}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Aufgaben</h3>
          {!loading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                {pendingTasks.length} offen
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                {completedTasks.length} erledigt
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsAddingTask(true)}
          disabled={loading || isSubmitting}
          className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Neue Aufgabe</span>
        </button>
      </div>

      {/* Add new task form */}
      {isAddingTask && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Neue Aufgabe eingeben..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                placeholder="Zugewiesen an..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                title="Fälligkeitsdatum (optional)"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                  setNewTaskAssignee('');
                  setNewTaskDueDate('');
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Lade Aufgaben...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Aufgaben für diesen Kunden</p>
              <p className="text-sm">Fügen Sie eine neue Aufgabe hinzu, um zu beginnen</p>
            </div>
          ) : (
            <>
              {/* Pending tasks */}
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
                >
                  {editingTaskId === task.id ? (
                    // Edit mode
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Aufgabentitel..."
                        />
                        <input
                          type="text"
                          value={editTaskAssignee}
                          onChange={(e) => setEditTaskAssignee(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Zugewiesen an..."
                        />
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(e) => setEditTaskDueDate(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition-colors duration-200"
                          title="Speichern"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded transition-colors duration-200"
                          title="Abbrechen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          task.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-primary-blue'
                        }`}>
                          {task.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </label>
                      <span className={`flex-1 transition-all duration-200 ${
                        task.completed 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {task.title}
                        {task.due_date && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Fällig am: {new Date(task.due_date).toLocaleDateString('de-DE')})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {task.assignee}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(task.created_at)}
                      </span>
                      <button
                        onClick={() => handleEditTask(task.id)}
                        className="opacity-100 flex-shrink-0 text-blue-400 hover:text-blue-600 p-1 rounded transition-all duration-200"
                        title="Aufgabe bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-100 flex-shrink-0 text-red-400 hover:text-red-600 p-1 rounded transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {/* Completed tasks */}
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 group"
                >
                  {editingTaskId === task.id ? (
                    // Edit mode
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Aufgabentitel..."
                        />
                        <input
                          type="text"
                          value={editTaskAssignee}
                          onChange={(e) => setEditTaskAssignee(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Zugewiesen an..."
                        />
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(e) => setEditTaskDueDate(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition-colors duration-200"
                          title="Speichern"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded transition-colors duration-200"
                          title="Abbrechen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="sr-only"
                        />
                        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </label>
                      <span className="flex-1 text-gray-500 line-through">
                        {task.title}
                        {task.due_date && (
                          <span className="text-xs text-gray-400 ml-2">
                            (Fällig am: {new Date(task.due_date).toLocaleDateString('de-DE')})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {task.assignee}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(task.created_at)}
                      </span>
                      <button
                        onClick={() => handleEditTask(task.id)}
                        className="opacity-100 flex-shrink-0 text-blue-400 hover:text-blue-600 p-1 rounded transition-all duration-200"
                        title="Aufgabe bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-100 flex-shrink-0 text-red-400 hover:text-red-600 p-1 rounded transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};