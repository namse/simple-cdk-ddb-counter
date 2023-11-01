import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler(event) {
  console.log(event);
  const count = await getCount();
  const nextCount = count + 1;
  await saveCount(nextCount);
  return nextCount;
}

async function getCount() {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: process.env.DdbTableName,
      Key: { pk: "count" },
    })
  );

  const count = Item?.count ?? 0;
  return count;
}

async function saveCount(count) {
  await docClient.send(
    new PutCommand({
      TableName: process.env.DdbTableName,
      Item: { pk: "count", count },
    })
  );
}
