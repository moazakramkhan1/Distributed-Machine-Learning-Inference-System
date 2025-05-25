import React from 'react';
import './PredictionResults.css';

const PredictionResults = ({ predictions }) => {
    const downloadCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8," +
            predictions.map((p, i) => `Row ${i + 1},${p}`).join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "predictions.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="results-container">
            <h3>Predictions:</h3>
            <ul>
                {predictions.map((pred, index) => (
                    <li key={index}>Row {index + 1}: {pred}</li>
                ))}
            </ul>
            <button className="download-btn" onClick={downloadCSV}>
                Download CSV
            </button>
        </div>
    );
};

export default PredictionResults;
