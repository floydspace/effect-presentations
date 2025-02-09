import { SNS } from "@effect-aws/client-sns";
import { Cause, Config, Effect, Layer } from "effect";
import { EventBus } from "./abstract";

export const SNSEventBusLive = Layer.effect(
  EventBus,
  Effect.gen(function* () {
    const domainTopicArn = yield* Config.string("DOMAIN_TOPIC_ARN");
    const sns = yield* SNS;

    const sendMessage = <T>(
      exchangeType: string,
      from: string,
      to: string,
      payload: T
    ) =>
      sns
        .publish({
          TopicArn: domainTopicArn,
          Message: JSON.stringify(payload),
          MessageAttributes: {
            source: { DataType: "String", StringValue: from },
            destination: { DataType: "String", StringValue: to },
            exchange_type: { DataType: "String", StringValue: exchangeType },
          },
        })
        .pipe(
          Effect.catchAll((e) => new Cause.UnknownException(e)),
          Effect.asVoid
        );

    return EventBus.of({
      publish: (from, payload) =>
        sendMessage("fanout", from, "subscriber", payload),
    });
  })
).pipe(Layer.provide(SNS.layer({ logger: true })));
