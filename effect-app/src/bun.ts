import { handler } from "./index";

export default {
  async fetch(request: Request): Promise<Response> {
    const { event, ...context }: any = await request.json();
    await handler(event, context);
    return new Response();
  },
};
