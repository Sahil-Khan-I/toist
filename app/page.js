'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Toist() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load todos from localStorage on component mount with error handling
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem('toist-todos');
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
      }
    } catch (error) {
      console.error("Error loading todos from localStorage:", error);
      setError("Failed to load saved todos. Starting fresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save todos to localStorage whenever todos change with error handling
  const saveTodos = useCallback((newTodos) => {
    try {
      localStorage.setItem('toist-todos', JSON.stringify(newTodos));
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error("Error saving todos to localStorage:", error);
      setError("Failed to save todos. Your changes may not persist.");
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveTodos(todos);
    }
  }, [todos, isLoading, saveTodos]);

  const addTodo = () => {
    const trimmedValue = inputValue.trim();
    
    // Enhanced input validation
    if (trimmedValue === '') {
      setError("Please enter a task.");
      return;
    }
    
    if (trimmedValue.length > 200) {
      setError("Task is too long. Please keep it under 200 characters.");
      return;
    }

    // Generate more robust ID using timestamp + random component
    const newTodo = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: trimmedValue,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTodos([...todos, newTodo]);
    setInputValue('');
    setError('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const updatedTodo = { ...todo, completed: !todo.completed };
        // Add completion time when marking as complete, remove when marking as incomplete
        if (!todo.completed) {
          updatedTodo.completedAt = new Date().toISOString();
        } else {
          delete updatedTodo.completedAt;
        }
        return updatedTodo;
      }
      return todo;
    }));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;

  // Helper function to format dates for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading your todos...</div>
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Toist
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Simple browser-based todo list
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Add Todo Input */}
        <section className="mb-6" aria-label="Add new todo">
          <div className="flex gap-2">
            <label htmlFor="todo-input" className="sr-only">
              Enter a new task
            </label>
            <input
              id="todo-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              maxLength={200}
              aria-describedby={error ? "error-message" : "task-hint"}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              onClick={addTodo}
              className="add-btn px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Add todo"
            >
              Add
            </button>
          </div>
          <div id="task-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {inputValue.length}/200 characters
          </div>
        </section>

        {/* Todo List */}
        <main className="todo-grid bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {todos.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No tasks yet. Add one above!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700" role="list" aria-label="Todo list">
              {todos.map((todo) => (
                <li key={todo.id} className="todo-item p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                    />
                    <div className="flex-1">
                      <span
                        className={`block ${
                          todo.completed
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {todo.text}
                      </span>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <span>Created {formatDate(todo.createdAt)}</span>
                        {todo.completed && todo.completedAt && (
                          <span className="ml-2">• Completed {formatDate(todo.completedAt)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="delete-btn text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                      aria-label={`Delete "${todo.text}"`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Stats and Actions */}
        {todos.length > 0 && (
          <section className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400" aria-label="Todo statistics">
            <div role="status" aria-live="polite">
              {activeCount} active, {completedCount} completed
            </div>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                aria-label={`Clear ${completedCount} completed tasks`}
              >
                Clear completed
              </button>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Data stored locally in your browser
        </footer>
      </div>
    </div>
  );
}
