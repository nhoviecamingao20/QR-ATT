import { getEventByCode } from "./events";
import { parseQRPayload } from "./qr";
import { supabase } from "./supabase";

export async function registerAttendance(
  rawPayload: string,
  studentId: string,
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);

  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }

  const payload = parsed.payload;

  const now = Date.now();
  const start = payload.start ? new Date(payload.start).getTime() : null;
  const end = payload.end ? new Date(payload.end).getTime() : null;

  if (start && now < start) {
    return {
      success: false,
      message: "Event has not started yet.",
    };
  }

  if (end && now > end) {
    return {
      success: false,
      message: "Event has already ended.",
    };
  }

  const title = payload.title ?? payload.event;

  let event: { id: string; title: string } | null = null;

  const foundEvent = await getEventByCode(payload.event);

  if (foundEvent) {
    event = foundEvent;
  } else {
    const { data: newEvent, error: insertError } = await supabase
      .from("events")
      .insert([
        {
          event_code: payload.event,
          title,
          start_time: payload.start ?? null,
          end_time: payload.end ?? null,
        },
      ])
      .select("id, title")
      .single();

    if (insertError) {
      return {
        success: false,
        message: "Could not create event.",
      };
    }

    event = newEvent;
  }

  const { error: attError } = await supabase.from("attendance").insert([
    {
      student_id: studentId,
      event_id: event.id,
    },
  ]);

  if (attError) {
    if (attError.code === "23505") {
      return {
        success: false,
        message: "Already registered for this event.",
        eventTitle: event.title,
      };
    }

    return {
      success: false,
      message: attError.message,
    };
  }

  return {
    success: true,
    message: "Attendance recorded!",
    eventTitle: event.title,
  };
}

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export async function getAttendanceHistory(
  studentId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, scanned_at, events ( event_code, title )")
    .eq("student_id", studentId)
    .order("scanned_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? "",
    eventTitle: row.events?.title ?? "Unknown event",
    scannedAt: row.scanned_at,
  }));
}

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    scannedAt: string;
    studentName: string | null;
  }[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export async function getTeacherEventAttendance(
  teacherId: string,
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from("events")
    .select("id, event_code, title, start_time, end_time")
    .eq("created_by", teacherId)
    .order("created_at", { ascending: false });

  if (eventError || !events) {
    return [];
  }

  const eventIds = events.map((e: any) => e.id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data: attendance, error: attError } = await supabase
    .from("attendance")
    .select("student_id, scanned_at, event_id")
    .in("event_id", eventIds)
    .order("scanned_at", { ascending: false });

  if (attError || !attendance) {
    return events.map((e: any) => ({
      eventId: e.id,
      eventCode: e.event_code,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
      attendeeCount: 0,
      attendees: [],
    }));
  }

  const studentIds = [...new Set(attendance.map((a: any) => a.student_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile: any) => [profile.id, profile.full_name]),
  );

  return events.map((e: any) => {
    const rows = attendance.filter((a: any) => a.event_id === e.id);

    return {
      eventId: e.id,
      eventCode: e.event_code,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
      attendeeCount: rows.length,
      attendees: rows.map((a: any) => ({
        studentId: a.student_id,
        studentName: profileMap.get(a.student_id) ?? null,
        scannedAt: a.scanned_at,
      })),
    };
  });
}

export async function getTeacherEventSummary(
  teacherId: string,
): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from("events")
    .select("id, event_code, title")
    .eq("created_by", teacherId)
    .order("created_at", { ascending: false });

  if (eventError || !events) return [];

  const eventIds = events.map((e: any) => e.id);

  if (eventIds.length === 0) return [];

  const { data: attRows, error: attError } = await supabase
    .from("attendance")
    .select("event_id")
    .in("event_id", eventIds);

  if (attError || !attRows) return [];

  const counts: Record<string, number> = {};

  attRows.forEach((r: any) => {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  });

  return events.map((e: any) => ({
    eventId: e.id,
    eventCode: e.event_code,
    title: e.title,
    attendeeCount: counts[e.id] ?? 0,
  }));
}