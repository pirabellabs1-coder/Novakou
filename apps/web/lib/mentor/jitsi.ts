/**
 * Jitsi Meet helper — generate meeting room URLs for mentor bookings.
 *
 * We use the free public Jitsi server (meet.jit.si). Rooms are created on-demand
 * by simply visiting the URL. No authentication, no API key, no cost.
 *
 * Room ID convention: freelancehigh-mentor-<bookingId>
 *   - Prefix makes rooms identifiable / hard to guess
 *   - Booking id is a cuid (collision-resistant)
 */

const JITSI_BASE_URL = "https://meet.jit.si";
const ROOM_PREFIX = "freelancehigh-mentor";

/**
 * Generate a deterministic room ID for a given booking.
 * Same booking id always gets the same room id.
 */
export function generateRoomId(bookingId: string): string {
  return `${ROOM_PREFIX}-${bookingId}`;
}

/**
 * Build the full Jitsi Meet URL for a booking.
 */
export function buildMeetingUrl(bookingId: string): string {
  return `${JITSI_BASE_URL}/${generateRoomId(bookingId)}`;
}

/**
 * Build a meeting URL from an existing room id (stored in DB).
 * Falls back to generating from bookingId if roomId is empty.
 */
export function meetingUrlFrom(roomId: string | null, bookingId: string): string {
  const id = roomId && roomId.length > 0 ? roomId : generateRoomId(bookingId);
  return `${JITSI_BASE_URL}/${id}`;
}

/**
 * Check if a session is "joinable now" — within 15 min of start time
 * and not yet 60 min past the end time.
 */
export function isJoinableNow(scheduledAt: Date, durationMinutes: number): boolean {
  const now = Date.now();
  const start = scheduledAt.getTime();
  const end = start + durationMinutes * 60 * 1000;
  const openFrom = start - 15 * 60 * 1000; // 15 min early
  const openUntil = end + 60 * 60 * 1000;  // 1h buffer after end
  return now >= openFrom && now <= openUntil;
}
