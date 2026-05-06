import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Landing from './components/Landing';
import Statistics from './components/Statistics';
import Terms from './components/Terms';
import LanguageSelect from './components/LanguageSelect';
import AssessmentForm from './components/AssessmentForm';
import ResultsPage from './components/ResultsPage';
import FeedbackPage from './components/FeedbackPage';
import TestPage from './components/TestPage';

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    // Expose lenis globally so every component can scroll immediately
    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
      delete window.lenis;
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/language" element={<LanguageSelect />} />
      <Route path="/assessment" element={<AssessmentForm />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  );
}

export default App;