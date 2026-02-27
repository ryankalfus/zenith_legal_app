import * as Calendar from "expo-calendar";

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getWritableCalendarId() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => {
    if (!calendar.allowsModifications) {
      return false;
    }
    const access = String((calendar as any).accessLevel ?? "").toLowerCase();
    return access !== "reader";
  });

  if (writable.length === 0) {
    return null;
  }

  const primary = writable.find((calendar) => Boolean((calendar as any).isPrimary));
  return (primary ?? writable[0]).id;
}

async function ensureCalendarPermission() {
  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Calendar.requestCalendarPermissionsAsync();
  return requested.granted;
}

export async function addAppointmentToDeviceCalendar(input: {
  title: string;
  notes?: string;
  startsAt: string;
  endsAt?: string;
}) {
  const startDate = parseDate(input.startsAt);
  if (!startDate) {
    throw new Error("Invalid appointment start time.");
  }
  const endDate = parseDate(input.endsAt ?? "") ?? new Date(startDate.getTime() + 30 * 60 * 1000);

  const hasPermission = await ensureCalendarPermission();
  if (!hasPermission) {
    throw new Error("Calendar permission is required.");
  }

  const calendarId = await getWritableCalendarId();
  if (!calendarId) {
    throw new Error("No writable calendar found on this device.");
  }

  await Calendar.createEventAsync(calendarId, {
    title: input.title,
    notes: input.notes?.trim() || undefined,
    startDate,
    endDate,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  });
}
