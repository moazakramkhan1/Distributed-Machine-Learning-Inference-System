import React, { useRef, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

import FileDropZone from './FileDropZone';
import FilePreview from './FilePreview';
import PredictionResults from './PredictionResults';

import './UploadForm.css';

const UploadForm = () => {
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const requiredCols = ["age", "income", "education"]; // modify as needed

    const handleFileSelect = (file) => {
        if (!file.name.endsWith(".csv")) {
            setError("Only .csv files are allowed.");
            return;
        }

        setFile(file);
        setError("");

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => setParsedData(results.data),
            error: () => setError("Failed to parse CSV.")
        });
    };

    const handleSubmit = async () => {
        if (!file) return;

        const headers = Object.keys(parsedData[0] || {});
        const hasRequired = requiredCols.every(col => headers.includes(col));
        if (!hasRequired) {
            setError("Missing required columns.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/predict/`, formData);
            setPredictions(res.data.predictions);
        } catch (err) {
            setError("Backend error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <h2>Upload CSV for Prediction</h2>

            <FileDropZone onFileSelect={handleFileSelect} fileRef={fileRef} file={file} />

            {parsedData.length > 0 && (
                <FilePreview data={parsedData} requiredCols={requiredCols} />
            )}

            {file && (
                <button className="submit-btn" onClick={handleSubmit}>
                    Submit to Backend
                </button>
            )}

            {loading && <p className="loading-text">Loading predictions...</p>}
            {error && <p className="error-message">{error}</p>}

            {predictions.length > 0 && (
                <PredictionResults predictions={predictions} />
            )}
        </div>
    );
};

export default UploadForm;
