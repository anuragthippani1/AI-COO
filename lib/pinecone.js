import { Pinecone } from '@pinecone-database/pinecone'

let pineconeClient = null

export async function getPineconeClient() {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is not set')
    }

    pineconeClient = new Pinecone({
      apiKey: apiKey,
    })
  }

  return pineconeClient
}

export async function getPineconeIndex() {
  const client = await getPineconeClient()
  const indexName = process.env.PINECONE_INDEX_NAME || 'ai-coo-memory'
  return client.index(indexName)
}



