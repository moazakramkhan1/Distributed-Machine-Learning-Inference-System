import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const TrainForm = () => {
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [targetColumn, setTargetColumn] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const uploaded = e.target.files[0];
        setFile(uploaded);
        setError("");
        setMessage("");
        setTargetColumn("");

        Papa.parse(uploaded, {
            header: true,
            complete: (results) => {
                const colNames = results.meta.fields;
                setColumns(colNames);
            },
            error: () => setError("Failed to parse CSV file."),
        });
    };

    const handleSubmit = async () => {
        if (!file || !targetColumn) {
            setError("Please select a CSV file and a target column.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("target_column", targetColumn);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/train/`, formData);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || "Training failed.");
        }
    };

    return (
        <div style={{ marginTop: "40px" }}>
            <h2>Upload CSV to Train Model</h2>
            <input type="file" accept=".csv" onChange={handleFileChange} />

            {columns.length > 0 && (
                <>
                    <p style={{ marginTop: "10px" }}>📊 Detected columns: {columns.join(", ")}</p>
                    <label style={{ marginTop: "10px", display: "block" }}>
                        Select target column:
                        <select
                            value={targetColumn}
                            onChange={(e) => setTargetColumn(e.target.value)}
                            style={{ marginLeft: "10px" }}
                        >
                            <option value="">-- Choose --</option>
                            {columns.map((col, idx) => (
                                <option key={idx} value={col}>{col}</option>
                            ))}
                        </select>
                    </label>
                </>
            )}

            <button onClick={handleSubmit} style={{ marginTop: "15px" }}>
                Train Model
            </button>

            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default TrainForm;
