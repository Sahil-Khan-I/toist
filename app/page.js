'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Memoized TodoItem component for better performance
const TodoItem = ({ todo, onToggle, onDelete }) => {
  const createdDate = useMemo(() => formatDate(todo.createdAt), [todo.createdAt]);
  const completedDate = useMemo(() => 
    todo.completedAt ? formatDate(todo.completedAt) : null, 
    [todo.completedAt]
  );

  return (
    <li className="todo-item">
      <div className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
        <button
          onClick={() => onToggle(todo.id)}
          className={`checkbox mt-1 ${todo.completed ? 'checked' : ''}`}
          aria-checked={todo.completed}
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        >
          {todo.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium transition-all ${
            todo.completed
              ? 'line-through text-muted-foreground'
              : 'text-foreground'
          }`}>
            {todo.text}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Created {createdDate}</span>
            {todo.completed && completedDate && (
              <>
                <span>•</span>
                <span>Completed {completedDate}</span>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onDelete(todo.id)}
          className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10"
          aria-label={`Delete "${todo.text}"`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </li>
  );
};

// Helper function for date formatting
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    return diffInMinutes <= 1 ? 'just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 48) {
    return 'yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

export default function Toist() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load todos from localStorage on component mount with error handling
  useEffect(() => {
    if (!isClient) return;
    
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
  }, [isClient]);

  // Save todos to localStorage whenever todos change with error handling
  const saveTodos = useCallback((newTodos) => {
    if (!isClient) return;
    
    try {
      localStorage.setItem('toist-todos', JSON.stringify(newTodos));
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error("Error saving todos to localStorage:", error);
      setError("Failed to save todos. Your changes may not persist.");
    }
  }, [isClient]);

  useEffect(() => {
    if (!isLoading && isClient) {
      saveTodos(todos);
    }
  }, [todos, isLoading, isClient, saveTodos]);

  // Generate a more robust unique ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

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
      id: generateId(),
      text: trimmedValue,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };    setTodos([...todos, newTodo]);
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

  // Don't render until we're on the client side to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <div className="app-container min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground tracking-tight">
              Toist
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              A beautifully simple todo list to keep you organized and productive
            </p>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
        </header>

        {/* Main Content Card */}
        <div className="card p-8 space-y-8">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

        {/* Add Todo Input */}
        <div className="space-y-6">
          {/* Add Todo Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Add New Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); addTodo(); }} className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What needs to be done?"
                className="input flex-1"
                disabled={isLoading}
                aria-label="Enter new todo item"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isLoading || inputValue.trim() === ''}
                className="btn btn-primary btn-lg px-8"
                aria-label="Add todo item"
              >
                Add Task
              </button>
            </form>
            {inputValue.length > 450 && (
              <p className="text-sm text-muted-foreground">
                {500 - inputValue.length} characters remaining
              </p>
            )}
          </div>

          {/* Todo List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {todos.length === 0 ? 'Your tasks' : `Tasks (${todos.length})`}
              </h2>
              {todos.length > 0 && (
                <div className="flex gap-2">
                  <span className="badge badge-secondary">
                    {activeCount} active
                  </span>
                  {completedCount > 0 && (
                    <span className="badge badge-default">
                      {completedCount} done
                    </span>
                  )}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading your tasks...</p>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                  <p className="text-muted-foreground">Add your first task above to get started</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3" role="list" aria-label="Todo items">
                {todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Actions Section */}
          {todos.length > 0 && completedCount > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex justify-center">
                <button
                  onClick={clearCompleted}
                  className="btn btn-ghost text-destructive hover:bg-destructive/10"
                  aria-label={`Clear ${completedCount} completed tasks`}
                >
                  Clear {completedCount} completed task{completedCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            ✨ Data saved locally in your browser ✨
          </p>
        </footer>
        </div>
      </div>
    </div>
  );
}
