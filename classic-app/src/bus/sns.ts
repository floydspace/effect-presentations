import { SNS } from "@aws-sdk/client-sns";
import { EventBus } from "./abstract";

export class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
  }

  async send<T>(from: string, to: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: to },
        exchange_type: { DataType: "String", StringValue: "direct" },
      },
    });
  }

  async publish<T>(from: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: "subscriber" },
        exchange_type: { DataType: "String", StringValue: "fanout" },
      },
    });
  }
}
