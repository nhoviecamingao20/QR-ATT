import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/colors";
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from "@/lib/attendance";
import { useAuth } from "@/lib/auth";
import { getProfile, type Role } from "@/lib/profiles";

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);

  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);

  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>(
    [],
  );

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? "student";

    setRole(currentRole);

    if (currentRole === "teacher") {
      const events = await getTeacherEventAttendance(user.id);

      setTeacherEvents(events);
      setStudentRecords([]);
    } else {
      const records = await getAttendanceHistory(user.id);

      setStudentRecords(records);
      setTeacherEvents([]);
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /*
   * TEACHER HISTORY
   */
  if (role === "teacher") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Attendance History</Text>

        {loading ? (
          <Text style={styles.subtitle}>Loading records...</Text>
        ) : teacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>No events created yet.</Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* EVENT DETAILS + ATTENDEE COUNT */}
                <View style={styles.cardTop}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{item.title}</Text>

                    <Text style={styles.eventMeta}>
                      Event Code: {item.eventCode}
                    </Text>

                    <Text style={styles.eventMeta}>
                      Start:{" "}
                      {item.startTime ? formatDate(item.startTime) : "N/A"}
                    </Text>

                    <Text style={styles.eventMeta}>
                      End: {item.endTime ? formatDate(item.endTime) : "N/A"}
                    </Text>
                  </View>

                  {/* ATTENDEE COUNT */}
                  <View style={styles.attendeeBadge}>
                    <Text style={styles.attendeeLabel}>Attendees</Text>

                    <Text style={styles.attendeeCount}>
                      {item.attendeeCount}
                    </Text>
                  </View>
                </View>

                {/* ATTENDEE NAMES */}
                {item.attendees.length > 0 && (
                  <View style={styles.attendeeList}>
                    <Text style={styles.attendeeListTitle}>Attendees:</Text>

                    {item.attendees.map((attendee) => (
                      <Text
                        key={`${item.eventId}-${attendee.studentId}`}
                        style={styles.attendeeName}
                      >
                        • {attendee.studentName ?? "Unknown student"}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    );
  }

  /*
   * STUDENT HISTORY
   */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : studentRecords.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={studentRecords}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>

              <Text style={styles.eventMeta}>{item.eventId}</Text>

              <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 32,
  },

  list: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  /*
   * EVENT DETAILS + COUNT
   */
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eventInfo: {
    flex: 1,
    paddingRight: 16,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /*
   * ATTENDEE COUNT
   */
  attendeeBadge: {
    minWidth: 82,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  attendeeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  attendeeCount: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /*
   * ATTENDEE NAMES
   */
  attendeeList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  attendeeListTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  attendeeName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
});