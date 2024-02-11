import { DefaultSNSServiceLayer, SNSService } from "@effect-aws/client-sns";
import { Cause, Config, Effect, Layer } from "effect";
import { EventBus } from "./abstract";

const EventBusLayer = Layer.effect(
  EventBus,
  Effect.gen(function* (_) {
    const domainTopicArn = yield* _(Config.string("DOMAIN_TOPIC_ARN"));
    const sns = yield* _(SNSService);

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
          Effect.asUnit
        );

    return EventBus.of({
      publish: (from, payload) =>
        sendMessage("fanout", from, "subscriber", payload),
    });
  })
);

export const SNSEventBusImpl = Layer.provide(
  EventBusLayer,
  DefaultSNSServiceLayer
);
