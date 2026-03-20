import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://192.168.1.14:5000/uoms";

const Uom = () => {
  const [name, setName] = useState("");
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await axios.get(API);
    setList(res.data);
  };

  const saveUom = async () => {
    if (!name) return;

    try {
      if (editId) {
        const res = await axios.put(`${API}/${editId}`, { name });

        setList(list.map(x =>
          x._id === editId ? res.data : x
        ));

        setEditId(null);
      } else {
        const res = await axios.post(API, { name });
        setList([res.data, ...list]);
      }

      setName("");
    } catch {
      alert("Error saving UOM");
    }
  };

  const editItem = (item) => {
    setName(item.name);
    setEditId(item._id);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this UOM?")) return;

    await axios.delete(`${API}/${id}`);
    setList(list.filter(x => x._id !== id));
  };

  return (
    <div className="w-full flex justify-center">

      <div className="bg-white w-full max-w-xl p-4 sm:p-6 rounded-2xl shadow-xl text-black">

        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          ⚖️ UOM
        </h1>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter UOM (Kg, Nos...)"
            className="w-full px-3 h-11 sm:h-10 border rounded-lg"
          />

          <button
            onClick={saveUom}
            className="w-full sm:w-auto px-4 h-11 sm:h-10 bg-blue-500 text-white rounded-lg"
          >
            {editId ? "Update" : "Add"}
          </button>
        </div>

        {/* List */}
        <ul className="space-y-2">
          {list.map((item) => (
            <li
              key={item._id}
              className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-lg"
            >
              {/* LEFT */}
              <div className="flex items-center gap-3">

                {/* ACTIVE TOGGLE */}
                <button
                  onClick={async () => {
                    const res = await axios.put(
                      `${API}/${item._id}/status`,
                      { isActive: !item.isActive }
                    );

                    setList(list.map(x =>
                      x._id === item._id ? res.data : x
                    ));
                  }}
                  className={`px-2 py-1 rounded text-xs ${
                    item.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-400 text-white"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </button>

                <span className={!item.isActive ? "text-gray-400 line-through" : ""}>
                  {item.name}
                </span>

              </div>

              {/* RIGHT */}
              <div className="flex gap-2">
                <button onClick={() => editItem(item)}>✏️</button>
                <button onClick={() => deleteItem(item._id)}>❌</button>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
};

export default Uom;