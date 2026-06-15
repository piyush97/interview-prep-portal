import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
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
import JDEvaluator from "./pages/JDEvaluator";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Offers from "./pages/Offers";
import Contacts from "./pages/Contacts";
import Journal from "./pages/Journal";
import CompareJobs from "./pages/CompareJobs";
import StoryBank from "./pages/StoryBank";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/interviews" element={<InterviewPrep />} />
          <Route path="/stories" element={<StoryBank />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/research" element={<Research />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/evaluate" element={<JDEvaluator />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/compare" element={<CompareJobs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
