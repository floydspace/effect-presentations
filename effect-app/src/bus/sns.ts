import {
  PublishCommandInput,
  PublishCommandOutput,
  SNS,
} from "@aws-sdk/client-sns";
import { Cause, Config, Context, Effect, Layer } from "effect";
import { EventBus } from "./abstract";

interface SNSService {
  publish: (
    params: PublishCommandInput
  ) => Effect.Effect<never, Cause.UnknownException, PublishCommandOutput>;
}

const SNSService = Context.Tag<SNSService>();

const SNSServiceLayer = Layer.effect(
  SNSService,
  Effect.gen(function* (_) {
    const sns = yield* _(Effect.try(() => new SNS()));

    return SNSService.of({
      publish: (params) => Effect.tryPromise(() => sns.publish(params)),
    });
  })
);

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
        .pipe(Effect.asUnit);

    return EventBus.of({
      send: (from, to, payload) => sendMessage("direct", from, to, payload),
      publish: (from, payload) =>
        sendMessage("fanout", from, "subscriber", payload),
    });
  })
);

export const SNSEventBusImpl = Layer.provide(EventBusLayer, SNSServiceLayer);
