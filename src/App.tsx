import { useMemo, useState } from "react";
import { exampleJson, parseJsonInput } from "./utils/json";
import { openCandidateWebpage } from "./utils/candidateWebpage";
import type { JsonValue } from "./types";

const DEFAULT_TITLE = "candidate-dossier";

function App() {
  const [jsonText, setJsonText] = useState<string>(exampleJson);
  const [reportTitleInput, setReportTitleInput] = useState<string>(DEFAULT_TITLE);

  const parsedResult = useMemo(() => {
    try {
      const data = parseJsonInput(jsonText);
      return { data, error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      return { data: null as JsonValue | null, error: message };
    }
  }, [jsonText]);

  const reportTitle = useMemo(() => {
    const base = reportTitleInput.trim() || DEFAULT_TITLE;
    return base.replace(/[^\w\s-]+/g, " ").replace(/\s+/g, " ").trim();
  }, [reportTitleInput]);

  return (
    <main className="page">
      <section className="panel hero">
        <h1>JSON to Candidate Webpage Converter</h1>
        <p>
          Paste JSON, validate instantly, and open a clean single-window
          candidate dossier view.
        </p>
      </section>

      <section className="panel controls">
        <label htmlFor="reportTitle">Report title</label>
        <input
          id="reportTitle"
          type="text"
          value={reportTitleInput}
          onChange={(e) => setReportTitleInput(e.target.value)}
          placeholder="candidate-dossier"
        />
      </section>

      <section className="panel editor">
        <div className="editorHeader">
          <h2>JSON Input</h2>
          <button type="button" onClick={() => setJsonText(exampleJson)}>
            Load sample
          </button>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
        />
      </section>

      <section className="panel output">
        <h2>Open View</h2>
        {parsedResult.error ? (
          <p className="error">Invalid JSON: {parsedResult.error}</p>
        ) : (
          <p className="success">JSON is valid and ready to open.</p>
        )}

        {parsedResult.data ? (
          <div className="actionsRow">
            <button
              type="button"
              className="downloadBtn webBtn"
              onClick={() => openCandidateWebpage(parsedResult.data as JsonValue, reportTitle)}
            >
              Open Candidate Single Window
            </button>
          </div>
        ) : (
          <button type="button" className="downloadBtn disabled" disabled>
            Open Candidate Single Window
          </button>
        )}
      </section>
    </main>
  );
}

export default App;
