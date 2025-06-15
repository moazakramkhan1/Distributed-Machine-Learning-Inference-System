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

export default function UploadModelForm() {
  const [file, setFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("model_file", file);

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/upload-model/", formData);
      setMessage(response.data.message || "✅ Model uploaded.");
    } catch (error) {
      console.error("Upload error:", error);
      if (error.response?.data?.detail) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Failed to upload model.");
      }
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Upload Trained Model</Typography>
      <input type="file" accept=".pkl" onChange={(e) => setFile(e.target.files[0])} />
      <Box sx={{ position: "relative", display: "inline-flex", mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          Upload
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