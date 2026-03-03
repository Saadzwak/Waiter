import { NextRequest } from "next/server";
import { buildChatStream } from "@/modules/chat/engine";
import { getRestaurantBySlug } from "@/modules/restaurants/queries";
import { trackEvent } from "@/modules/events/tracker";
import type { UIMessage } from "ai";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, slug, sessionId } = body as {
    messages: UIMessage[];
    slug: string;
    sessionId?: string;
  };

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return new Response("Restaurant not found", { status: 404 });
  }

  if (sessionId) {
    trackEvent({
      event: "message_sent",
      restaurant_id: restaurant.id,
      session_id: sessionId,
      properties: { message_count: messages.length },
    }).catch(console.error);
  }

  const result = await buildChatStream({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    menuLanguage: restaurant.language_default,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
