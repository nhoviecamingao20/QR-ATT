import { getEventByCode } from "./events";
import { parseQRPayload } from "./qr";
import { supabase } from "./supabase";

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
  studentId: string;
  studentName: string;
  scannedAt: string;
}[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string,
): Promise<RegisterResult> {
  // Step 1: Decode and validate QR
  const parsed = parseQRPayload(rawPayload);

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
    };
  }

  const payload = parsed.payload;

  // Step 2: Check event time
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

  // Step 3: Find or create event
  const title = payload.title ?? payload.event;

  let event: {
    id: string;
    title: string;
  } | null = null;

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

  // Step 4: Record attendance
  const { error: attError } = await supabase.from("attendance").insert([
    {
      student_id: studentId,
      event_id: event.id,
    },
  ]);

  if (attError) {
    // PostgreSQL error 23505 = unique constraint violation
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

export async function getAttendanceHistory(
  studentId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, scanned_at, events ( event_code, title )")
    .eq("student_id", studentId)
    .order("scanned_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? "",
    eventTitle: row.events?.title ?? "",
    scannedAt: row.scanned_at,
  }));
}

export async function getTeacherEventAttendance(
  teacherId: string,
): Promise<TeacherEventAttendance[]> {
  // Step 1: Get events created by this teacher
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

  // Step 2: Get attendance records
  // Keep this separate from profiles so the count is not affected by profile RLS.
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

  // Step 3: Get the student IDs from the attendance records
  const studentIds = [
    ...new Set(
      attendance.map((a: any) => a.student_id),
    ),
  ];

  // Step 4: Get student names separately
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  // Step 5: Create a quick lookup for profiles
  const profileMap: Record<
    string,
    { full_name: string | null; email: string | null }
  > = {};

  (profiles ?? []).forEach((profile: any) => {
    profileMap[profile.id] = {
      full_name: profile.full_name,
      email: profile.email,
    };
  });

  // Step 6: Group attendance by event
  return events.map((e: any) => {
    const rows = attendance.filter(
      (a: any) => a.event_id === e.id,
    );

    return {
      eventId: e.id,
      eventCode: e.event_code,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
      attendeeCount: rows.length,

      attendees: rows.map((a: any) => {
        const profile = profileMap[a.student_id];

        return {
          studentId: a.student_id,
          studentName:
            profile?.full_name ||
            profile?.email ||
            `…${a.student_id.slice(-8)}`,
          scannedAt: a.scanned_at,
        };
      }),
    };
  });
}