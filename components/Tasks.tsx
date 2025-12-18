
import React, { useState, useEffect } from 'react';
import { MOCK_TASKS } from '../services/mockData';
import { CheckCircle2, Circle, Calendar, Flag, Plus, Trash2, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  completed: boolean;
  type: string;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
      try {
          const saved = localStorage.getItem('arise_tasks');
          return saved ? JSON.parse(saved) : MOCK_TASKS;
      } catch (e) {
          console.error("Failed to load tasks", e);
          return MOCK_TASKS;
      }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', type: 'Call', priority: 'Medium', dueDate: 'Today' });
  
  // State for delete confirmation modal
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
      localStorage.setItem('arise_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const confirmDelete = () => {
    if (taskToDelete) {
        setTasks(prev => prev.filter(t => t.id !== taskToDelete));
        setTaskToDelete(null);
    }
  };

  const handleAddTask = () => {
    if (!newTask.title) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      completed: false,
      type: newTask.type
    };
    setTasks([task, ...tasks]);
    setIsModalOpen(false);
    setNewTask({ title: '', type: 'Call', priority: 'Medium', dueDate: 'Today' });
  };

  return (
    <div className="animate-fade-in space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Tasks</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
            <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No tasks remaining. Great job!</div>
          ) : tasks.map((task) => (
            <div 
              key={task.id} 
              className="p-4 hover:bg-slate-800/50 transition-colors flex items-center gap-4 group"
            >
              {/* Checkbox Button */}
              <button 
                onClick={() => toggleTask(task.id)}
                className="text-slate-500 hover:text-indigo-400 transition-colors flex-shrink-0"
              >
                 {task.completed ? <CheckCircle2 className="text-green-500" /> : <Circle />}
              </button>
              
              {/* Main Content (Clickable for toggle) */}
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => toggleTask(task.id)}
              >
                 <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.title}
                 </h4>
                 <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {task.dueDate}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 uppercase tracking-wide text-[10px] font-bold border border-slate-700">{task.type}</span>
                 </div>
              </div>

              {/* Priority Badge (Clickable for toggle) */}
              <div 
                onClick={() => toggleTask(task.id)}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer
                ${task.priority === 'High' ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 
                  task.priority === 'Medium' ? 'bg-orange-900/20 text-orange-400 border border-orange-900/30' : 'bg-green-900/20 text-green-400 border border-green-900/30'}`}
              >
                <Flag size={12} /> {task.priority}
              </div>

              {/* Delete Button (Triggers Modal) */}
              <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation(); 
                    setTaskToDelete(task.id);
                }}
                className="p-2 text-slate-600 hover:text-red-400 transition-all hover:bg-red-900/20 rounded-lg flex-shrink-0 opacity-0 group-hover:opacity-100"
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10 animate-fade-in border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="font-bold text-white">Add New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Task Title</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                  placeholder="e.g., Call John Doe"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                   <select 
                      className="w-full border border-slate-700 rounded-lg p-2 text-sm outline-none bg-slate-950 text-white"
                      value={newTask.type}
                      onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                   >
                     <option>Call</option>
                     <option>Email</option>
                     <option>Meeting</option>
                     <option>Admin</option>
                     <option>Quote</option>
                     <option>Compliance</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                   <select 
                      className="w-full border border-slate-700 rounded-lg p-2 text-sm outline-none bg-slate-950 text-white"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                   >
                     <option>Low</option>
                     <option>Medium</option>
                     <option>High</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-700 rounded-lg p-2 text-sm outline-none bg-slate-950 text-white"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAddTask}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center transform transition-all scale-100 border border-slate-800">
                <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/30">
                    <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Delete Task?</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setTaskToDelete(null)}
                        className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 text-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
