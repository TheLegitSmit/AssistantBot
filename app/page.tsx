'use client';

import React, { useEffect, useRef } from 'react';
import { Message, useAssistant } from '@ai-sdk/react';

export default function Chat() {
  const { status, messages, input, submitMessage, handleInputChange } =
    useAssistant({ api: '/api/assistant' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#333', color: '#fff', margin: 0, padding: '1em' }}>
      <header style={{ fontSize: '2em', marginBottom: '1em' }}>My Chitty Chatty Bot 🤖</header>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>This is an extremely simple, work-in-progress chatbot. Just a starting point, for now. Type your message and press send to interact with it.</p>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>At the moment, this goofball is set up to act like me on a dating app.</p>
      <p style={{ marginBottom: '1em', textAlign: 'center' }}>Your transcript will be stored and reviewed for quality assurance.</p>
      <div style={{ 
        padding: '1em', 
        backgroundColor: '#444', 
        borderRadius: '1em', 
        boxShadow: '0 0 10px rgba(0,0,0,0.1)', 
        width: '90%', 
        maxWidth: '600px', 
        height: '60vh', 
        display: 'flex', 
        flexDirection: 'column',
        border: '2px solid #666' // Added border
      }}>
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '1em', paddingRight: '0.5em' }}>
          {messages.map((m: Message) => (
            <div key={m.id} style={{ 
              marginBottom: '0.5em', 
              padding: '0.5em', 
              borderRadius: '0.5em',
              backgroundColor: m.role === 'assistant' ? 'rgba(173, 216, 230, 0.1)' : 'rgba(144, 238, 144, 0.1)',
              alignSelf: m.role === 'assistant' ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
              display: 'flex',
              justifyContent: m.role === 'assistant' ? 'flex-start' : 'flex-end' // Align text
            }}>
              <p style={{ color: m.role === 'assistant' ? 'lightblue' : 'lightgreen', margin: 0 }}>
                <strong>{m.role === 'assistant' ? 'Bot' : 'You'}:</strong> {m.role !== 'data' && m.content}
                {m.role === 'data' && (
                  <>
                    {(m.data as any).description}
                    <br />
                    <pre className={'bg-gray-200'}>
                      {JSON.stringify(m.data, null, 2)}
                    </pre>
                  </>
                )}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
          <input
            ref={inputRef}
            disabled={status !== 'awaiting_message'}
            value={input}
            placeholder="Type your message here..."
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={{ flexGrow: 1, marginRight: '0.5em', padding: '0.5em', border: '1px solid #ccc', borderRadius: '0.5em', backgroundColor: '#555', color: '#fff' }}
          />
          <button 
            type="submit" 
            disabled={status !== 'awaiting_message' || !input.trim()}
            style={{ 
              padding: '0.5em', 
              backgroundColor: status !== 'awaiting_message' || !input.trim() ? '#666' : 'blue', 
              color: 'white', 
              borderRadius: '0.5em',
              cursor: status !== 'awaiting_message' || !input.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Send
          </button>
        </form>
      </div>
      {status !== 'awaiting_message' && (
        <p style={{ marginTop: '1em', color: 'lightgray' }}>Bot is typing...</p>
      )}
    </div>
  );
}