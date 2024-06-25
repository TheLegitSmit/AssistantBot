'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message, useAssistant } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }
`;

const theme = {
  light: {
    background: '#f0f0f0',
    chatBackground: '#ffffff',
    text: '#333333',
    userMessage: 'rgba(144, 238, 144, 0.3)',
    assistantMessage: 'rgba(173, 216, 230, 0.3)',
    input: '#ffffff',
    inputText: '#333333',
    button: '#0066cc',
    buttonDisabled: '#cccccc',
  },
  dark: {
    background: '#333333',
    chatBackground: '#444444',
    text: '#ffffff',
    userMessage: 'rgba(144, 238, 144, 0.1)',
    assistantMessage: 'rgba(173, 216, 230, 0.1)',
    input: '#555555',
    inputText: '#ffffff',
    button: '#0099ff',
    buttonDisabled: '#666666',
  },
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
  padding: 1em;
`;

const Header = styled.header`
  font-size: 2em;
  margin-bottom: 1em;
`;

const ChatContainer = styled.div`
  padding: 1em;
  background-color: ${(props) => props.theme.chatBackground};
  border-radius: 1em;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  width: 90%;
  max-width: 600px;
  height: 60vh;
  display: flex;
  flex-direction: column;
  border: 2px solid ${(props) => props.theme.text};
  @media (max-width: 600px) {
    width: 95%;
    height: 70vh;
  }
`;

const MessageList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 1em;
  padding-right: 0.5em;
`;

const MessageBubble = styled.div<{ role: 'user' | 'assistant' }>`
  margin-bottom: 0.5em;
  padding: 0.5em;
  border-radius: 0.5em;
  background-color: ${(props) => props.role === 'assistant' ? props.theme.assistantMessage : props.theme.userMessage};
  align-self: ${(props) => (props.role === 'assistant' ? 'flex-start' : 'flex-end')};
  max-width: 80%;
  word-wrap: break-word;
  text-align: ${(props) => (props.role === 'assistant' ? 'left' : 'right')};
`;

const RoleName = styled.div`
  font-weight: bold;
  margin-bottom: 0.5em;
`;

const InputForm = styled.form`
  display: flex;
`;

const Input = styled.input`
  flex-grow: 1;
  margin-right: 0.5em;
  padding: 0.5em;
  border: 1px solid ${(props) => props.theme.text};
  border-radius: 0.5em;
  background-color: ${(props) => props.theme.input};
  color: ${(props) => props.theme.inputText};
`;

const Button = styled.button<{ disabled: boolean }>`
  padding: 0.5em;
  background-color: ${(props) => props.disabled ? props.theme.buttonDisabled : props.theme.button};
  color: white;
  border: none;
  border-radius: 0.5em;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
`;

const TypingIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1em;
  span {
    width: 10px;
    height: 10px;
    margin: 0 5px;
    background-color: ${(props) => props.theme.text};
    border-radius: 50%;
    display: inline-block;
    animation: bounce 1.4s infinite ease-in-out both;
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1.0);
    }
  }
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: ${(props) => props.theme.text};
  cursor: pointer;
  font-size: 1.5em;
`;

export default function Chat() {
  const { status, messages, input, submitMessage, handleInputChange } = useAssistant({ api: '/api/assistant' });
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderers = {
    a: ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: isDarkMode ? 'lightblue' : 'blue' }}>
        {children}
      </a>
    ),
  };

  return (
    <ThemeProvider theme={isDarkMode ? theme.dark : theme.light}>
      <GlobalStyle />
      <Container>
        <ThemeToggle onClick={toggleTheme}>
          {isDarkMode ? '☀️' : '🌙'}
        </ThemeToggle>
        <Header>My Chitty Chatty Bot 🤖</Header>
        <p>This is an extremely simple, work-in-progress chatbot. Just a starting point, for now. Type your message and press send to interact with it.</p>
        <p>This bot acts as my website frontpage assistant. Imagine you are a small business owner, and tell it what kind of business you run.</p>
        <p>Your transcript will be stored and reviewed for quality assurance.</p>
        <ChatContainer>
          <MessageList>
            {messages.map((m: Message) => (
              <MessageBubble key={m.id} role={m.role as 'user' | 'assistant'}>
                <RoleName>{m.role === 'assistant' ? 'SmitBot 3000' : 'You'}:</RoleName>
                <ReactMarkdown rehypePlugins={[rehypeRaw]} components={renderers}>
                  {m.role === 'assistant' ? `${m.content}` : `${m.content}`}
                </ReactMarkdown>
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </MessageList>
          <InputForm onSubmit={handleSubmit}>
            <Input
              ref={inputRef}
              disabled={status !== 'awaiting_message'}
              value={input}
              placeholder="Type your message here..."
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              aria-label="Chat message"
            />
            <Button type="submit" disabled={status !== 'awaiting_message' || !input.trim()} aria-label="Send message">
              Send
            </Button>
          </InputForm>
        </ChatContainer>
        {status !== 'awaiting_message' && (
          <TypingIndicator>
            <span></span>
            <span></span>
            <span></span>
          </TypingIndicator>
        )}
      </Container>
    </ThemeProvider>
  );
}
