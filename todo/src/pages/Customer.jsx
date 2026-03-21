import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/customers`;

const Customer = () => {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: ""
    });

    const [list, setList] = useState([]);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const res = await axios.get(API);
        setList(res.data);
    };

    const saveCustomer = async () => {
        if (!form.name || !form.phone) {
            alert("Name & Phone required");
            return;
        }

        try {
            if (editId) {
                const res = await axios.put(`${API}/${editId}`, form);

                setList(list.map(x =>
                    x._id === editId ? res.data : x
                ));

                setEditId(null);
            } else {
                const res = await axios.post(API, form);
                setList([res.data, ...list]);
            }

            setForm({
                name: "",
                phone: "",
                email: "",
                address: ""
            });

        } catch (err) {
            alert(err.response?.data?.error || "Error saving customer");
        }
    };

    const editItem = (item) => {
        setForm({
            name: item.name,
            phone: item.phone,
            email: item.email,
            address: item.address
        });
        setEditId(item._id);
    };

    const deleteItem = async (id) => {
        if (!window.confirm("Delete this customer?")) return;

        await axios.delete(`${API}/${id}`);
        setList(list.filter(x => x._id !== id));
    };

    return (
        <div className="w-full flex justify-center">

            <div className="bg-white w-full max-w-xl p-4 sm:p-6 rounded-2xl shadow-xl text-black">

                <h1 className="text-xl sm:text-2xl font-bold mb-4">
                    👤 Customer
                </h1>

                {/* FORM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">

                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Name"
                        className="px-3 h-11 border rounded-lg"
                    />

                    <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Phone"
                        className="px-3 h-11 border rounded-lg"
                    />

                    <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Email"
                        className="px-3 h-11 border rounded-lg"
                    />

                    <input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Address"
                        className="px-3 h-11 border rounded-lg"
                    />

                    <button
                        onClick={saveCustomer}
                        className="col-span-1 sm:col-span-2 px-4 h-11 bg-blue-500 text-white rounded-lg"
                    >
                        {editId ? "Update Customer" : "Add Customer"}
                    </button>
                </div>

                {/* LIST */}
                <ul className="space-y-2">
                    {list.map((item) => (
                        <li
                            key={item._id}
                            className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-lg"
                        >
                            {/* LEFT */}
                            <div className="flex flex-col">

                                <span className="font-semibold">
                                    {item.name}
                                </span>

                                <span className="text-sm text-gray-600">
                                    📞 {item.phone}
                                </span>

                                {item.email && (
                                    <span className="text-sm text-gray-500">
                                        ✉️ {item.email}
                                    </span>
                                )}

                                {item.address && (
                                    <span className="text-sm text-gray-500">
                                        📍 {item.address}
                                    </span>
                                )}
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

export default Customer;