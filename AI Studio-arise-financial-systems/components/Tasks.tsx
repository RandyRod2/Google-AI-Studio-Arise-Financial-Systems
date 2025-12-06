
import React, { useState, useEffect } from 'react';
import { MOCK_TASKS } from '../services/mockData';
import { CheckCircle2, Circle, Calendar, Flag, Plus, Trash2, X } from 'lucide-react';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState(() => {
      const saved = localStorage.getItem('arise_tasks');
      return saved ? JSON.parse(saved) : MOCK_TASKS;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', type: 'Call', priority: 'Medium', dueDate: 'Today' });

  useEffect(() => {
      localStorage.setItem('arise_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t: any) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter((t: any) => t.id !== id));
  };

  const handleAddTask = () => {
    if (!newTask.title) return;
    const task = {
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
        <h2 className="text-2xl font-bold text-slate-800">My Tasks</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
            <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tasks remaining. Great job!</div>
          ) : tasks.map((task: any) => (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer"
            >
              <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                 {task.completed ? <CheckCircle2 className="text-green-500" /> : <Circle />}
              </button>
              <div className="flex-1">
                 <h4 className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                    {task.title}
                 </h4>
                 <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {task.dueDate}</span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 uppercase tracking-wide text-[10px] font-bold">{task.type}</span>
                 </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1
                ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 
                  task.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                <Flag size={12} /> {task.priority}
              </div>
              <button 
                onClick={(e) => deleteTask(task.id, e)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-200/60 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-black/5">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-slate-800">Add New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                  placeholder="e.g., Call John Doe"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                   <select 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none bg-white text-slate-900"
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
                   <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                   <select 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none bg-white text-slate-900"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none bg-white text-slate-900"
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
    </div>
  );
};

export default Tasks;
