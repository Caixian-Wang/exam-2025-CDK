import { Handler, SNSEvent } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: process.env.REGION });

export const handler: Handler = async (event: SNSEvent) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    for (const record of event.Records) {
      const message = JSON.parse(record.Sns.Message);
      if (!message.email) {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: process.env.QUEUE_B_URL,
            MessageBody: JSON.stringify(message),
          })
        );
        console.log("Message sent to Queue B:", message);
      } else {
        console.log("Message contains email, not sending to Queue B.");
      }
    }
  } catch (error: any) {
    console.error("Error in Lambda Y:", error);
    throw new Error(JSON.stringify(error));
  }
};
