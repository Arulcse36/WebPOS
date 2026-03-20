import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://192.168.1.14:5000/todos";

const Todo = () => {
  const [task, setTask] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(API)
      .then(res => setTodos(res.data))
      .catch(() => alert("Failed to load todos"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const isOverdue = (date) => new Date(date) < new Date();

  const addTodo = async () => {
    if (!task || !targetDate) return;

    try {
      const res = await axios.post(API, {
        text: task,
        completed: false,
        targetDate
      });

      setTodos([...todos, res.data]);
      setTask("");
      setTargetDate("");
    } catch {
      alert("Error adding task");
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await axios.put(`${API}/${id}`, {
        completed: !completed
      });

      setTodos(todos.map(t => t._id === id ? res.data : t));
    } catch {
      alert("Error updating task");
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      setTodos(todos.filter(t => t._id !== id));
    } catch {
      alert("Error deleting task");
    }
  };

  const sortedTodos = [...todos].sort(
    (a, b) => new Date(a.targetDate) - new Date(b.targetDate)
  );

  return (
    <div className="w-full flex justify-center">

      <div className="bg-white w-full max-w-2xl h-auto sm:h-[85vh] flex flex-col p-4 sm:p-6 rounded-2xl shadow-xl">

        <h1 className="text-xl sm:text-2xl font-bold text-center text-blue-600 mb-2">
          📝 Todo App
        </h1>

        <p className="text-sm text-gray-500 text-center mb-3">
          {todos.filter(t => t.completed).length} / {todos.length} completed
        </p>

        {/* Inputs */}
        <div className="flex flex-col gap-2 mb-4 sm:flex-row">

          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a new task..."
            className="w-full px-3 h-11 sm:h-10 border rounded-lg text-black bg-white"
          />

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full sm:w-40 px-2 h-11 sm:h-10 border rounded-lg text-black bg-white"
          />

          <button
            onClick={addTodo}
            disabled={!task || !targetDate}
            className={`w-full sm:w-auto h-11 sm:h-12 px-6 text-base sm:text-lg rounded-lg font-medium
  ${!task || !targetDate
                ? 'bg-gray-300'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-full text-black">

          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : sortedTodos.length === 0 ? (
            <p className="text-center text-gray-400">No tasks yet 🚀</p>
          ) : (
            <ul className="space-y-3">
              {sortedTodos.map((todo) => (
                <li
                  key={todo._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-100 px-4 py-3 rounded-lg gap-2"
                >
                  {/* LEFT SIDE */}
                  <div className="flex items-start sm:items-center gap-3 w-full">

                    <button
                      onClick={() => toggleTodo(todo._id, todo.completed)}
                      className={`w-5 h-5 rounded border flex items-center justify-center
        ${todo.completed ? "bg-green-500 text-white" : "bg-white"}`}
                    >
                      {todo.completed && "✔"}
                    </button>

                    <div className="flex flex-col break-words flex-1">
                      <span className={todo.completed ? "line-through text-gray-400" : ""}>
                        {todo.text}
                      </span>

                      <span className={`text-sm ${isOverdue(todo.targetDate) && !todo.completed
                          ? "text-red-500"
                          : "text-gray-600"
                        }`}>
                        📅 {formatDate(todo.targetDate)}
                      </span>
                    </div>

                    {/* DELETE BUTTON (FIXED POSITION) */}
                    <button
                      onClick={() => deleteTodo(todo._id)}
                      className="text-red-500 text-lg ml-auto sm:ml-4"
                    >
                      ❌
                    </button>

                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default Todo;