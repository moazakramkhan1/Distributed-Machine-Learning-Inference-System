// File: src/App.jsx
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Container, Typography, Box, AppBar, Toolbar, CssBaseline } from "@mui/material";
import TrainForm from "./components/TrainForm";
import PredictForm from "./components/PredictForm";

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
          <TrainForm />
          <Box my={4} />
          <PredictForm />
        </Container>
      </Box>
    </ThemeProvider>
  );
}
