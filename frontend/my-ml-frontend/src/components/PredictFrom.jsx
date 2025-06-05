// File: src/components/PredictForm.jsx
import React, { useState } from "react";
import {
    Box,
    Button,
    Paper,
    Snackbar,
    Alert,
    Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function PredictForm() {
    const [file, setFile] = useState(null);
    const [results, setResults] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const handlePredict = async () => {
        if (!file) {
            setSnackbar({ open: true, message: "Please upload a CSV file.", severity: "error" });
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/predict", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || "Prediction failed");

            setResults(result.predictions);
            setSnackbar({ open: true, message: "✅ Predictions successful.", severity: "success" });
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: "error" });
        }
    };

    return (
        <Paper sx={{ p: 3 }} elevation={4}>
            <Typography variant="h6" gutterBottom>
                Predict with Trained Model
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
                    Upload CSV for Prediction
                    <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files[0])} />
                </Button>

                <Button variant="contained" color="primary" onClick={handlePredict}>
                    Predict
                </Button>

                {results && (
                    <Box mt={2}>
                        <Typography variant="subtitle1">Predictions:</Typography>
                        <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                            <pre>{JSON.stringify(results, null, 2)}</pre>
                        </Paper>
                    </Box>
                )}
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
}
