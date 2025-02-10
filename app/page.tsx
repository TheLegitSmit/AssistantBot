'use client';

import React, { useEffect, useRef } from 'react';
import { Message, useAssistant } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';

/* Global styles with smooth transitions */
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: ${(props) => props.theme.bodyBackground};
    color: ${(props) => props.theme.textColor};
    transition: background 0.3s ease, color 0.3s ease;
  }
`;

/* Light theme adjusted to blend with a white website background */
const lightTheme = {
  bodyBackground: 'linear-gradient(135deg, #FFFFFF, #F7F7F7)',
  chatCardBackground: '#FAF9F7',
  textColor: '#333333',
  userBubble: '#d0e8ff',         // soft pastel blue for user messages
  assistantBubble: '#f0f0f0',    // light grey for assistant messages
  inputBackground: '#ffffff',
  inputBorder: '#dddddd',
  sendButton: '#007aff',
  sendButtonHover: '#005bb5',
};

/* Styled Components for layout and elements */
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  position: relative;
`;

const Header = styled.header`
  width: 100%;
  max-width: 800px;
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
`;

const Tagline = styled.p`
  margin: 0.5rem 0 0;
  font-size: 1rem;
  color: ${(props) => props.theme.textColor};
`;

const ChatCard = styled.div`
  background: ${(props) => props.theme.chatCardBackground};
  width: 100%;
  max-width: 800px;
  height: 70vh;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.inputBorder};
`;

const MessageList = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: ${(props) => props.theme.chatCardBackground};
`;

const Notice = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.textColor};
  text-align: center;
  padding: 0.5rem;
  border-top: 1px solid ${(props) => props.theme.inputBorder};
  background: ${(props) => props.theme.chatCardBackground};
`;

const Bubble = styled.div<{ $role: 'user' | 'assistant' }>`
  align-self: ${(props) => (props.$role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${(props) =>
    props.$role === 'user' ? props.theme.userBubble : props.theme.assistantBubble};
  /* Set user text color to black */
  color: ${(props) => (props.$role === 'user' ? '#000' : props.theme.textColor)};
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
  max-width: 80%;
  line-height: 1.4;
  font-size: 1rem;
  &:after {
    content: "";
    position: absolute;
    top: 0.75rem;
    ${(props) =>
      props.$role === 'user'
        ? `right: -0.5rem; border-left: 0.5rem solid ${props.theme.userBubble};`
        : `left: -0.5rem; border-right: 0.5rem solid ${props.theme.assistantBubble};`}
    border-top: 0.5rem solid transparent;
    border-bottom: 0.5rem solid transparent;
  }
`;

const InputContainer = styled.form`
  display: flex;
  border-top: 1px solid ${(props) => props.theme.inputBorder};
  padding: 0.75rem;
  background: ${(props) => props.theme.chatCardBackground};
`;

const InputBox = styled.input`
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 999px;
  background: ${(props) => props.theme.inputBackground};
  color: ${(props) => props.theme.textColor};
  outline: none;
  transition: border 0.2s ease;
  &:focus {
    border-color: ${(props) => props.theme.sendButton};
  }
`;

const SendButton = styled.button`
  margin-left: 0.75rem;
  padding: 0 1rem;
  background: ${(props) => props.theme.sendButton};
  color: #fff;
  font-size: 1rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover {
    background: ${(props) => props.theme.sendButtonHover};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  gap: 0.3rem;
  span {
    width: 8px;
    height: 8px;
    background: ${(props) => props.theme.textColor};
    border-radius: 50%;
    animation: blink 1.4s infinite both;
  }
  span:nth-child(2) {
    animation-delay: 0.2s;
  }
  span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes blink {
    0%, 80%, 100% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
  }
`;

/* Markdown styling wrapper with custom link rendering */
const MarkdownWrapper = styled.div`
  p {
    margin: 0;
  }
  a {
    color: ${(props) => props.theme.sendButton};
    text-decoration: underline;
    cursor: pointer;
  }
`;

// Custom link renderer that forces links to open in a new tab.
const LinkRenderer = ({ href, children, ...props }: { href?: string; children: React.ReactNode }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    if (href) window.open(href, '_blank');
  };
  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};

// Explicitly type the initial assistant message as Message.
const initialAssistantMessage: Message = {
  id: 'init-1',
  role: 'assistant',
  content:
    "Hello, I'm Michael's virtual assistant. What brought you to our website today? Feel free to chat with me in natural language, just like you would with a person.",
};

export default function Chat() {
  const { status, messages, input, submitMessage, handleInputChange } = useAssistant({ api: '/api/assistant' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayMessages = messages.length > 0 ? messages : [initialAssistantMessage];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const onSubmit = (e: React.FormEvent) => {
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
    <ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      <PageContainer>
        <Header>
          <Title>Chat Assistant</Title>
          <Tagline>Ask anything – our AI is here to help.</Tagline>
        </Header>
        <ChatCard>
          <MessageList>
            {displayMessages.map((msg) => (
              <Bubble key={msg.id} $role={msg.role as 'user' | 'assistant'}>
                <MarkdownWrapper>
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={{ a: LinkRenderer }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </MarkdownWrapper>
              </Bubble>
            ))}
            <div ref={messagesEndRef} />
          </MessageList>
          <Notice>
            Your transcript will be stored and reviewed for quality assurance.
          </Notice>
          <InputContainer onSubmit={onSubmit}>
            <InputBox
              ref={inputRef}
              disabled={status !== 'awaiting_message'}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              aria-label="Chat input"
            />
            <SendButton
              type="submit"
              disabled={status !== 'awaiting_message' || !input.trim()}
              aria-label="Send message"
            >
              Send
            </SendButton>
          </InputContainer>
        </ChatCard>
        {status !== 'awaiting_message' && (
          <TypingIndicator aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </TypingIndicator>
        )}
      </PageContainer>
    </ThemeProvider>
  );
}
