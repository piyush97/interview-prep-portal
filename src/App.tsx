import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Applications = lazy(() => import("./pages/Applications"));
const ApplicationDetail = lazy(() => import("./pages/ApplicationDetail"));
const InterviewPrep = lazy(() => import("./pages/InterviewPrep"));
const Skills = lazy(() => import("./pages/Skills"));
const Resume = lazy(() => import("./pages/Resume"));
const Research = lazy(() => import("./pages/Research"));
const Learn = lazy(() => import("./pages/Learn"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Resources = lazy(() => import("./pages/Resources"));
const JDEvaluator = lazy(() => import("./pages/JDEvaluator"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Settings = lazy(() => import("./pages/Settings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Offers = lazy(() => import("./pages/Offers"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Journal = lazy(() => import("./pages/Journal"));
const CompareJobs = lazy(() => import("./pages/CompareJobs"));
const StoryBank = lazy(() => import("./pages/StoryBank"));

function PageFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-500">
      Loading...
    </div>
  );
}

function page(element: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={page(<Dashboard />)} />
          <Route path="/applications" element={page(<Applications />)} />
          <Route path="/applications/:id" element={page(<ApplicationDetail />)} />
          <Route path="/interviews" element={page(<InterviewPrep />)} />
          <Route path="/stories" element={page(<StoryBank />)} />
          <Route path="/skills" element={page(<Skills />)} />
          <Route path="/resume" element={page(<Resume />)} />
          <Route path="/research" element={page(<Research />)} />
          <Route path="/learn" element={page(<Learn />)} />
          <Route path="/flashcards" element={page(<Flashcards />)} />
          <Route path="/resources" element={page(<Resources />)} />
          <Route path="/evaluate" element={page(<JDEvaluator />)} />
          <Route path="/reminders" element={page(<Reminders />)} />
          <Route path="/settings" element={page(<Settings />)} />
          <Route path="/onboarding" element={page(<Onboarding />)} />
          <Route path="/offers" element={page(<Offers />)} />
          <Route path="/contacts" element={page(<Contacts />)} />
          <Route path="/journal" element={page(<Journal />)} />
          <Route path="/compare" element={page(<CompareJobs />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
