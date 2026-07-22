import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./contexts/AuthContext.tsx";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/cards.css";
import "./styles/modal.css";
import { ToastProvider } from './contexts/ToastContext.tsx';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
