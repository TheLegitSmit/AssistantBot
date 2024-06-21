import { AssistantResponse } from 'ai';
import OpenAI from 'openai';
import { GraphQLClient, gql } from 'graphql-request';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const hygraphEndpoint = process.env.HYGRAPH_ENDPOINT;
const hygraphToken = process.env.HYGRAPH_TOKEN;

if (!hygraphEndpoint || !hygraphToken) {
  throw new Error('Missing required Hygraph environment variables');
}

const hygraphClient = new GraphQLClient(hygraphEndpoint, {
  headers: {
    authorization: `Bearer ${hygraphToken}`,
  },
});

async function saveChat(threadId: string, userMessage: string, assistantMessage: string) {
  const saveConversationMutation = gql`
    mutation($threadId: String!, $userMessage: String!, $assistantMessage: String!, $timestamp: DateTime!) {
      createChatTranscript(data: { 
        threadId: $threadId, 
        userMessage: $userMessage, 
        assistantMessage: $assistantMessage, 
        timestamp: $timestamp 
      }) {
        id
      }
    }
  `;

  const timestamp = new Date().toISOString();

  try {
    await hygraphClient.request(saveConversationMutation, {
      threadId,
      userMessage,
      assistantMessage,
      timestamp,
    });
    console.log(`Chat transcript saved for thread ${threadId}`);
  } catch (error) {
    console.error('Error saving chat transcript to Hygraph:', error);
  }
}

export async function POST(req: Request) {
  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
  } = await req.json();

  // Create a thread if needed
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: input.message,
  });

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Run the assistant on the thread
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          process.env.ASSISTANT_ID ??
          (() => {
            throw new Error('ASSISTANT_ID is not set');
          })(),
      });

      // forward run status would stream message deltas
      let runResult = await forwardStream(runStream);

      // status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
      while (
        runResult?.status === 'requires_action' &&
        runResult.required_action?.type === 'submit_tool_outputs'
      ) {
        // ... (tool call handling code remains the same)
      }

      // After the run is completed, fetch the assistant's response and save the transcript
      if (runResult?.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        const assistantMessage = messages.data[0].content[0]; // Assuming the latest message is the assistant's response
        
        if (assistantMessage.type === 'text') {
          // Save the chat transcript
          await saveChat(threadId, input.message, assistantMessage.text.value);
        }
      }
    },
  );
}