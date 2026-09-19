export type NotificationType =
  | "daily_verse"
  | "new_photos"
  | "live_stream"
  | "new_testimony"
  | "new_prayer"
  | "event_today"
  | "live_starting_soon"
  | "custom";

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string | null;
  url: string | null;
  timestamp: string;
  isRead: boolean;
}
