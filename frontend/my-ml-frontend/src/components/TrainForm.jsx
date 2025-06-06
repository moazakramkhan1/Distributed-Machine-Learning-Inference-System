import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const modelOptions = [
  { value: "random_forest", label: "Random Forest" },
  { value: "logistic_regression", label: "Logistic Regression" },
  { value: "svm", label: "SVM" },
];

export default function TrainForm({onTrainingSuccess}) {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [modelType, setModelType] = useState("RandomForestClassifier");
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [trainingSuccess, setTrainingSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTrain = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", targetColumn);
    formData.append("model_type", modelType);

    try {
      const response = await axios.post("http://localhost:8000/train", formData);
      setMessage(response.data.message || "✅ Model trained.");
      setTrainingSuccess(true);
      onTrainingSuccess?.();
    } catch (error) {
      console.error("Train error:", error);
      if (error.response?.data?.detail) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Failed to train model.");
      }
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Train Model</Typography>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <TextField
        label="Target Column"
        value={targetColumn}
        onChange={(e) => setTargetColumn(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        select
        label="Model Type"
        value={modelType}
        onChange={(e) => setModelType(e.target.value)}
        fullWidth
        margin="normal"
      >
        {modelOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ position: "relative", display: "inline-flex", mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleTrain}
          disabled={loading}
        >
          Train
        </Button>
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-12px",
              marginLeft: "-12px",
            }}
          />
        )}
      </Box>

      {trainingSuccess && !loading && (
        <Button
          variant="contained"
          color="secondary"
          href="http://localhost:8000/download-model"
          sx={{ mt: 2, ml: 2 }}
          download
        >
          Download Trained Model
        </Button>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="info">
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
