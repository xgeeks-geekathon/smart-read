import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { ConversationalRetrievalQAChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { createClient } from 'redis'
import { RedisVectorStore } from 'langchain/vectorstores/redis'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { BufferMemory, ChatMessageHistory } from 'langchain/memory'
import { AIChatMessage, HumanChatMessage } from 'langchain/schema'

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const client = createClient({
    url: 'redis://localhost:6379'
  })

  await client.connect()

  const indexStore = new RedisVectorStore(new OpenAIEmbeddings(), {
    redisClient: client,
    indexName: String(userId)
  })

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-16k',
    temperature: 0.1
  })

  const chatHistory = messages.map((message: Message) => {
    if (message.role === 'assistant') {
      return new AIChatMessage(message.content)
    }
    return new HumanChatMessage(message.content)
  })

  const memory = new BufferMemory({
    returnMessages: true,
    inputKey: 'question',
    outputKey: 'text',
    memoryKey: 'chat_history',
    chatHistory: new ChatMessageHistory(chatHistory)
  })

  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = `Given the following conversation and a follow up question, return the conversation history excerpt that includes any relevant context to the question if it exists and rephrase the follow up question to be a standalone question.
  Chat History:
  {chat_history}
  Follow Up Input: {question}
  Your answer should follow the following format:
  \`\`\`
  Use the following pieces of context to answer the users question.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------------
  <Relevant chat history excerpt as context here>
  Standalone question: <Rephrased question here>
  \`\`\`
  Your answer:`

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    indexStore.asRetriever(),
    {
      memory,
      questionGeneratorChainOptions: {
        template: CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT
      }
    }
  )

  const lastMessage = messages[messages.length - 1].content

  const response = await chain.call({
    question: lastMessage
  })

  await client.disconnect()

  return NextResponse.json(response.text)
}
