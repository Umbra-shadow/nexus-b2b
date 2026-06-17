import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type PutCommandInput,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { ulid } from 'ulid'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

const TABLE = process.env.DYNAMODB_TABLE_MESSAGES ?? 'nexusb2b_messages'

export type MessageType = 'text' | 'system' | 'ai_response' | 'receipt_ref' | 'attachment' | 'card'

export interface ChatMessage {
  session_id: string
  message_id: string
  sender_id: string
  sender_name: string
  sender_business: string
  content: string
  type: MessageType
  created_at: string
  receipt_id?: string
  // Attachment (PDF)
  attachment_key?: string
  attachment_name?: string
  attachment_size?: number
  // Resolved server-side for display — not stored in Dynamo
  attachment_url?: string
}

export async function putMessage(
  message: Omit<ChatMessage, 'message_id' | 'created_at'>
): Promise<ChatMessage> {
  const item: ChatMessage = {
    ...message,
    message_id: ulid(),
    created_at: new Date().toISOString(),
  }

  const params: PutCommandInput = {
    TableName: TABLE,
    Item: item,
  }

  await docClient.send(new PutCommand(params))
  return item
}

export async function getMessages(
  sessionId: string,
  limit = 100
): Promise<ChatMessage[]> {
  const params: QueryCommandInput = {
    TableName: TABLE,
    KeyConditionExpression: 'session_id = :sid',
    ExpressionAttributeValues: { ':sid': sessionId },
    ScanIndexForward: true,
    Limit: limit,
  }

  const result = await docClient.send(new QueryCommand(params))
  return (result.Items ?? []) as ChatMessage[]
}

export async function putSystemMessage(
  sessionId: string,
  content: string,
  type: MessageType = 'system'
): Promise<ChatMessage> {
  return putMessage({
    session_id: sessionId,
    sender_id: 'system',
    sender_name: 'NexusB2B',
    sender_business: 'NexusB2B',
    content,
    type,
  })
}
