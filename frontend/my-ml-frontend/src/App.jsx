import React from "react";
import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Container, Typography, Box, AppBar, Toolbar, CssBaseline } from "@mui/material";
import PredictForm from './components/PredictFrom'
import TrainForm from './components/TrainForm'
import UploadModelForm from './components/UploadModelForm';


const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});

export default function App() {
  const [training, setTraining] = useState(false)
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">ML Model Trainer & Predictor</Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          <UploadModelForm onTrainingSuccess={() => setTraining(true)} />
          <Box my={4} />
          <TrainForm onTrainingSuccess={() => setTraining(true)} />
          <Box my={4} />
          {training && <PredictForm />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}


