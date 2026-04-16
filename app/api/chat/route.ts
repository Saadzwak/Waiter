import { NextRequest } from "next/server";
import { buildChatStream } from "@/modules/chat/engine";
import { getRestaurantBySlug } from "@/modules/restaurants/queries";
import { trackEvent } from "@/modules/events/tracker";
import type { UIMessage } from "ai";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const {
    messages,
    slug,
    sessionId,
  } = (body ?? {}) as {
    messages?: UIMessage[];
    slug?: string;
    sessionId?: string | null;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Missing messages", { status: 400 });
  }
  if (typeof slug !== "string" || !slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return new Response("Restaurant not found", { status: 404 });
  }

  const { stream, analytics } = await buildChatStream({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    menuLanguage: restaurant.language_default,
    messages,
  });

  // Only track when we have a valid session id. The session endpoint is
  // called on client mount, but the first message can race ahead of it.
  // Better to drop analytics than insert "" into a UUID column.
  const validSessionId =
    typeof sessionId === "string" && UUID_RE.test(sessionId) ? sessionId : null;

  if (validSessionId) {
    trackEvent({
      event: "message_sent",
      restaurant_id: restaurant.id,
      session_id: validSessionId,
      properties: {
        ...analytics,
        hour: new Date().getHours(),
        day_of_week: new Date().getDay(),
        message_index: messages.length,
      },
    }).catch(console.error);
  }

  return stream.toUIMessageStreamResponse();
}
