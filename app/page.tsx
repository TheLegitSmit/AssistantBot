"use client";

import { Message, experimental_useAssistant as useAssistant } from "ai/react";
import { useEffect, useRef } from "react";

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const roleToColorMap: Record<Message["role"], string> = isDarkMode ? {
  system: "lightcoral",
  user: "lightblue",
  assistant: "lightgreen",
  function: "white",
  data: "white",
  tool: "white"
} : {
  system: "darkred",
  user: "darkblue",
  assistant: "darkgreen",
  function: "black",
  data: "black",
  tool: "black"
};

export default function Chat() {
  const { status, messages, input, submitMessage, handleInputChange, error } =
    useAssistant({
      api: "/api/assistant",
    });

  // When status changes to accepting messages, focus the input:
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (status === "awaiting_message") {
      inputRef.current?.focus();
    }
  }, [status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#333', color: '#fff', margin: 0 }}>
      <header style={{ fontSize: '2em', marginBottom: '1em' }}>My Chitty Chatty Bot 🤖</header>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>This is a work in progress as I learn the wild world of coding.</p>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>I do not see or store transcripts, but it does send text to OpenAI in order for the bot to work.</p>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>Note: Responses may take a bit of time. I improved its functionality, but also slowed it down a lot. I am working, okay? Chill.</p>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>For the purposes of testing and for fun, this is the embarrassing AI chatbot I used to have in my online dating profile.</p>
      <div style={{ border: '1px solid #ccc', borderRadius: '1em', padding: '1em', width: '100%', maxWidth: '800px', backgroundColor: '#444' }}>
        {error != null && (
          <div style={{ fontSize: '2em', marginBottom: '1em', backgroundColor: 'red', color: 'white', padding: '1em', borderRadius: '1em' }}>
            Error: {(error as any).toString()}
          </div>
        )}

        {messages.map((m: Message) => (
          <div
            key={m.id}
            style={{
              marginBottom: '1em',
              color: roleToColorMap[m.role],
              textAlign: m.role === 'user' ? 'right' : 'left',
            }}
          >
            <strong>{`${m.role}: `}</strong>
            <br />
            {m.role !== "data" && m.content}
            {m.role === "data" && (
              <>
                {(m.data as any).description}
                <br />
                <pre style={{ backgroundColor: '#555', padding: '1em', borderRadius: '1em' }}>
                  {JSON.stringify(m.data, null, 2)}
                </pre>
              </>
            )}
            <br />
            <br />
          </div>
        ))}

        {status === "in_progress" && (
          <div style={{ height: '8px', width: '100%', padding: '1em', marginBottom: '1em', backgroundColor: '#555', borderRadius: '1em' }} />
        )}

        <form onSubmit={submitMessage} style={{ display: 'flex', padding: '1em', backgroundColor: '#555', borderRadius: '1em', boxShadow: '0 0 10px rgba(0,0,0,0.1)', width: '100%' }}>
          <input
            ref={inputRef}
            disabled={status !== "awaiting_message"}
            value={input}
            placeholder="Type your message here..."
            onChange={handleInputChange}
            style={{ flexGrow: 1, marginRight: '0.5em', padding: '0.5em', border: '1px solid #ccc', borderRadius: '0.5em', backgroundColor: '#666', color: '#fff' }}
          />
          <button type="submit" style={{ padding: '0.5em', backgroundColor: 'blue', color: 'white', borderRadius: '0.5em' }}>Send</button>
        </form>
      </div>
    </div>
  );
}
