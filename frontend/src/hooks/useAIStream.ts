import { useState } from "react";

interface StreamPayload {
  question: string;
  case_id: string;
  mode: string;
}

export function useAIStream() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  const startStream = async (payload: StreamPayload) => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      // Determine the API base URL
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${API_BASE}/api/investigator/ask-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) {
        throw new Error("Streaming not supported");
      }
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr.trim() === "[DONE]") {
                continue;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  setError(data.error);
                } else if (data.text) {
                  setResponse(prev => (prev || "") + data.text);
                }
              } catch(e) {
                // Ignore unparseable chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while streaming.");
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, response, startStream, setResponse, setError, setLoading };
}
