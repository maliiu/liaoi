import { MongoClient } from "mongodb";
import { env } from "../env";

const client = new MongoClient(env.mongoUri);
export const mongoPromise = client.connect();

export async function getMessagesCollection() {
  const connection = await mongoPromise;
  return connection.db().collection("messages");
}
