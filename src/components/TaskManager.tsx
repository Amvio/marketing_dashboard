import React, { useState } from 'react';
import { Plus, Check, X, Calendar } from 'lucide-react';
import { Task } from '../types/dashboard';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (title: string, assignee: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && newTaskAssignee.trim()) {
      onAddTask(newTaskTitle.trim(), newTaskAssignee.trim());
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setIsAddingTask(false);
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Aufgaben</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
              {pendingTasks.length} offen
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              {completedTasks.length} erledigt
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsAddingTask(true)}
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
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                  setNewTaskAssignee('');
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
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Keine Aufgaben vorhanden</p>
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
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
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
                </span>
                <span className="text-xs text-gray-400">
                  {task.assignee}
                </span>
                <span className="text-xs text-gray-400">
                  {task.createdAt.toLocaleDateString('de-DE')}
                </span>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Completed tasks */}
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 group"
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="sr-only"
                  />
                  <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </label>
                <span className="flex-1 text-gray-500 line-through">
                  {task.title}
                </span>
                <span className="text-xs text-gray-400">
                  {task.assignee}
                </span>
                <span className="text-xs text-gray-400">
                  {task.createdAt.toLocaleDateString('de-DE')}
                </span>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};