import { createContext, useContext, useState, useCallback } from "react";

const CoachEmailContext = createContext(null);

export function CoachEmailProvider({ children }) {
  const [currentSection, setCurrentSection] = useState(null);
  // { label: "Closing Punch", content: "...", source: "Speech Coach" }

  const registerSection = useCallback((label, content, source) => {
    setCurrentSection({ label, content, source });
  }, []);

  const clearSection = useCallback(() => {
    setCurrentSection(null);
  }, []);

  return (
    <CoachEmailContext.Provider value={{ currentSection, registerSection, clearSection }}>
      {children}
    </CoachEmailContext.Provider>
  );
}

export function useCoachEmail() {
  return useContext(CoachEmailContext);
}