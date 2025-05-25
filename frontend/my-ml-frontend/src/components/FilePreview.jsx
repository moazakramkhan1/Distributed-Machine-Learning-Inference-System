import React from 'react';
import './FilePreview.css';

const FilePreview = ({ data, requiredCols }) => {
    const cols = data.length > 0 ? Object.keys(data[0]) : [];
    const hasAllRequired = requiredCols.every(col => cols.includes(col));

    return (
        <div>
            <h4>Preview:</h4>
            <table className="preview-table">
                <thead>
                    <tr>
                        {cols.map((col, idx) => <th key={idx}>{col}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                            {cols.map((col, idx) => <td key={idx}>{row[col]}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!hasAllRequired && (
                <p className="preview-warning">
                    ❌ Missing required columns: {requiredCols.filter(col => !cols.includes(col)).join(', ')}
                </p>
            )}
        </div>
    );
};

export default FilePreview;
