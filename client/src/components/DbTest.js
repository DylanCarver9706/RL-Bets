import React, { useState, useEffect } from "react";
import { db } from "../config/firebaseConfig";  
import { ref, push, set, onValue, remove, update } from "firebase/database";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const todoRef = ref(db, "todos");
    onValue(todoRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const todoArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setTodos(todoArray);
      } else {
        setTodos([]);
      }
    });
  }, []);

  // Add New Task
  const addTodo = () => {
    if (task.trim() === "") return;
    const newTodoRef = push(ref(db, "todos"));
    set(newTodoRef, { text: task, completed: false });
    setTask("");
  };

  // Delete Task
  const deleteTodo = (id) => {
    remove(ref(db, `todos/${id}`));
  };

  // Toggle Completion
  const toggleComplete = (id, completed) => {
    update(ref(db, `todos/${id}`), { completed: !completed });
  };

  // Start Editing
  const startEditing = (id, text) => {
    setEditId(id);
    setEditText(text);
  };

  // Save Edited Task
  const saveEdit = () => {
    if (editText.trim() === "") return;
    update(ref(db, `todos/${editId}`), { text: editText });
    setEditId(null);
    setEditText("");
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">To-Do List</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          className="border p-2 flex-1 rounded-l"
          placeholder="Add new task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
        <button 
          className="bg-blue-500 text-white px-4 rounded-r"
          onClick={addTodo}
        >
          Add
        </button>
      </div>

      <ul>
        {todos.map(({ id, text, completed }) => (
          <li 
            key={id} 
            className={`flex items-center justify-between p-2 border-b ${
              completed ? "line-through text-gray-500" : ""
            }`}
          >
            {editId === id ? (
              <input
                className="border p-1 flex-1"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <span 
                className="flex-1 cursor-pointer" 
                onClick={() => toggleComplete(id, completed)}
              >
                {text}
              </span>
            )}

            <div className="flex gap-2">
              {editId === id ? (
                <button 
                  className="bg-green-500 text-white px-2 rounded" 
                  onClick={saveEdit}
                >
                  Save
                </button>
              ) : (
                <button 
                  className="text-blue-500" 
                  onClick={() => startEditing(id, text)}
                >
                  Edit
                </button>
              )}

              <button 
                className="text-red-500" 
                onClick={() => deleteTodo(id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
