// Shapes returned by the app's JSON API (snake_case, dates as ISO strings).

export interface SiteSettingRow {
  setting_key: string;
  setting_value: string | null;
}

export interface SiteSettingFull extends SiteSettingRow {
  id: string;
  setting_type: string;
  category: string;
  display_name: string;
  description: string | null;
}

export interface DailyVerse {
  id: string;
  verse_text: string;
  verse_reference: string;
  book_name: string;
  chapter: number;
  verse_number: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  category: string;
  image_url: string | null;
  is_published: boolean;
  max_participants: number | null;
  registration_required: boolean;
  contact_info?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistrationField {
  id: string;
  event_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_placeholder: string | null;
  field_options: string[];
  field_order: number;
  is_required: boolean;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  registration_data: Record<string, unknown>;
  spreadsheet_id: string | null;
  synced_to_sheets: boolean;
  synced_at: string | null;
  created_at: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string | null;
  location: string | null;
  is_default: boolean;
  created_at: string;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  stream_url: string;
  embed_url: string | null;
  thumbnail_url: string | null;
  is_live: boolean;
  is_active: boolean;
  chat_enabled: boolean;
  viewer_count: number | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LiveStreamInsert = Partial<Omit<LiveStream, "id" | "created_at" | "updated_at">> & {
  title: string;
  stream_url: string;
  platform: string;
};
export type LiveStreamUpdate = Partial<LiveStreamInsert>;

export interface Testimony {
  id: string;
  name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrayerRequest {
  id: string;
  name: string;
  request_text: string;
  category: string;
  is_urgent: boolean;
  allow_public_share: boolean;
  has_contact_info: boolean;
  is_approved: boolean;
  approved_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicPrayerRequest {
  id: string;
  display_name: string;
  request_text: string;
  category: string;
  is_urgent: boolean;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  image_url: string;
  is_published: boolean;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  event_date: string | null;
  drive_folder_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  photos?: GalleryPhoto[];
}

export interface MediaCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  artist: string | null;
  media_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  category_id: string | null;
  category?: MediaCategory | null;
  is_published: boolean;
  is_radio: boolean;
  play_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomNotification {
  id: string;
  title: string;
  message: string;
  icon: string | null;
  url: string | null;
  is_active: boolean;
  created_at: string;
}

export type StreamPlatform = "youtube" | "facebook" | "custom";
