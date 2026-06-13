import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import InterviewPrep from "./pages/InterviewPrep";
import Skills from "./pages/Skills";
import Resume from "./pages/Resume";
import Research from "./pages/Research";
import Learn from "./pages/Learn";
import Flashcards from "./pages/Flashcards";
import Resources from "./pages/Resources";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/interviews" element={<InterviewPrep />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/research" element={<Research />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
