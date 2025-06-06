import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

export default function PredictForm() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/predict", formData);
      setPredictions(response.data.predictions);
      setMessage("✅ Predictions generated.");
    } catch (error) {
      console.error("Predict error:", error);
      if (error.response?.data?.detail) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Failed to get predictions.");
      }
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Make Predictions</Typography>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />

      <Box sx={{ position: "relative", display: "inline-flex", mt: 2 }}>
        <Button
          variant="contained"
          onClick={handlePredict}
          disabled={loading}
        >
          Predict
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

      {predictions.length > 0 && !loading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Predictions:</Typography>
          <pre>{JSON.stringify(predictions, null, 2)}</pre>
        </Box>
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
