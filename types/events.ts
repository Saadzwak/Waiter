export type TrackEventName =
  | "session_started"
  | "menu_viewed"
  | "dish_clicked"
  | "message_sent"
  | "recommendation_shown"
  | "recommendation_clicked";

export interface TrackEvent {
  event: TrackEventName;
  restaurant_id: string;
  session_id: string;
  properties?: Record<string, unknown>;
}
