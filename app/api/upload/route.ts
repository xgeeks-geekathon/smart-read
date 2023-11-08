import { auth } from '@/auth'
import { existsSync, mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { EPubLoader } from 'langchain/document_loaders/fs/epub'
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient, createCluster } from "redis";
import { RedisVectorStore } from "langchain/vectorstores/redis";

export async function POST(request: NextRequest) {
  const userId = (await auth())?.user.id
  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const data = await request.formData()
  const file: File | null = data.get('file') as unknown as File

  if (!file) {
    return NextResponse.json({ success: false })
  }

  const folderName = `files/${userId}`

  try {
    if (!existsSync(folderName)) {
      mkdirSync(folderName)
    }
  } catch (err) {
    console.error(err)
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const path = `files/${userId}/${file.name}`
  await writeFile(path, buffer)

  const loader = new EPubLoader(`./${path}`,  {
    splitChapters: false,
  })
  const docs = await loader.load()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
  });
  
  const splitDocs = await textSplitter.splitDocuments(docs);

  try {
    const client = createClient({
      url: 'redis://localhost:6379'
    });
    await client.connect();

    try {
      const oldStore = new RedisVectorStore(new OpenAIEmbeddings(), {
        redisClient: client,
        indexName: String(userId)
      })
      await oldStore.dropIndex()
    } catch {
    }
    
    const vectorStore = await RedisVectorStore.fromDocuments(
      splitDocs,
      new OpenAIEmbeddings(),
      {
        redisClient: client,
        indexName: String(userId),
      }
    );

    await client.disconnect();

  } catch (e) {
  }

  return NextResponse.json({ success: true })
}
