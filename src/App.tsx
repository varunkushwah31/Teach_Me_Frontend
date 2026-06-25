// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import StudyPage from './pages/StudyPage';
import QuizPage from "./pages/QuizPage.tsx"; // Added StudyPage import

const App = () => (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/study" element={<StudyPage />} /> {/* Added Study Route */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
            <Route path="/quiz" element={<QuizPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
);

export default App;