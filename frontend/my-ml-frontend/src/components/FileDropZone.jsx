import React from 'react';
import './FileDropZone.css';

const FileDropZone = ({ onFileSelect, fileRef, file }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
        fileRef.current.style.border = '2px dashed #007BFF';
    };

    const handleDragLeave = () => {
        fileRef.current.style.border = '2px dashed #ccc';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        fileRef.current.style.border = '2px dashed #ccc';
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            onFileSelect(droppedFile);
        }
    };

    return (
        <div
            ref={fileRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="drop-zone"
        >
            {file ? (
                <p><strong>Selected File:</strong> {file.name}</p>
            ) : (
                <p>Drag & drop your CSV here or click to upload</p>
            )}
            <input
                type="file"
                accept=".csv"
                onChange={(e) => onFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
                id="csvUpload"
            />
            <label htmlFor="csvUpload" className="file-label">
                Browse Files
            </label>
        </div>
    );
};

export default FileDropZone;
