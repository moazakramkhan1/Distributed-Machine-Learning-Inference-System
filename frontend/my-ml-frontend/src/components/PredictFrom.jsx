import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

export default function PredictForm() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/predict", formData);
      setPredictions(response.data.predictions);
      setMessage(response.data.message);
      setFileId(response.data.prediction_file);
      setShowDownloadPrompt(true);
    } catch (error) {
      console.error("Predict error:", error);
      if (error.response?.data?.detail) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Failed to get predictions.");
      }
    } finally {
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/download-predictions/${fileId}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "predictions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Delay cleanup to ensure download has started
      setTimeout(async () => {
        await axios.delete(`http://localhost:8000/cleanup/${fileId}`);
      }, 3000);

      setShowDownloadPrompt(false);
      setPredictions([]);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };


  const handleSkip = async () => {
    await axios.delete(`http://localhost:8000/cleanup/${fileId}`);
    setShowDownloadPrompt(false);
    setPredictions([]);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Make Predictions</Typography>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <Button variant="contained" onClick={handlePredict} sx={{ mt: 2 }}>Predict</Button>
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
      {predictions?.length > 0 && (
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

      <Dialog open={showDownloadPrompt}>
        <DialogTitle>Download Predictions?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to download your predictions? If not, your model and prediction file will be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkip}>Delete</Button>
          <Button onClick={handleDownload} autoFocus>
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}