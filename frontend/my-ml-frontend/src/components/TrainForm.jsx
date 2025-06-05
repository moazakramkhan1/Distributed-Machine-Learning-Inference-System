// File: src/components/TrainForm.jsx
import React, { useState } from "react";
import {
    Box,
    Button,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    TextField,
    Snackbar,
    Alert,
    Typography,
    Paper,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function TrainForm() {
    const [file, setFile] = useState(null);
    const [target, setTarget] = useState("");
    const [modelType, setModelType] = useState("random_forest");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const handleSubmit = async () => {
        if (!file || !target) {
            setSnackbar({ open: true, message: "Please upload a file and specify the target column.", severity: "error" });
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("target_column", target);
        formData.append("model_type", modelType);

        try {
            const response = await fetch("/train", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.detail || "Training failed");

            setSnackbar({ open: true, message: result.message, severity: "success" });
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: "error" });
        }
    };

    return (
        <Paper sx={{ p: 3 }} elevation={4}>
            <Typography variant="h6" gutterBottom>
                Train New Model
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
                <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
                    Upload CSV
                    <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files[0])} />
                </Button>

                <TextField
                    label="Target Column"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    fullWidth
                />

                <FormControl fullWidth>
                    <InputLabel>Model Type</InputLabel>
                    <Select
                        value={modelType}
                        label="Model Type"
                        onChange={(e) => setModelType(e.target.value)}
                    >
                        <MenuItem value="random_forest">Random Forest</MenuItem>
                        <MenuItem value="logistic_regression">Logistic Regression</MenuItem>
                        <MenuItem value="svm">SVM</MenuItem>
                    </Select>
                </FormControl>

                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Train Model
                </Button>

                <Button
                    variant="outlined"
                    color="secondary"
                    href="/download-model"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download Trained Model
                </Button>
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
