import { normalizeUid } from "./uid";
import type {
    AttendanceEntry,
    AttendanceSnapshot,
    EnrichedScan,
    RfidScan,
    Student
} from "../types";

/*
 * How long after the class starts a student may still check in and
 * count as on time. Tap after this and the register marks them late,
 * measured from the moment the class started.
 *
 * Set to 0 to make every check-in after the start time late.
 */
export const GRACE_PERIOD_MINUTES = 10;

/* Whole minutes between the class starting and this tap */

export function minutesAfterStart(
    scannedAt: string,
    sessionStart: string | null
): number {

    if (!sessionStart) {
        return 0;
    }

    const diffMs =
        new Date(scannedAt).getTime() - new Date(sessionStart).getTime();

    return Math.max(0, Math.floor(diffMs / 60000));

}

/* "12 min" / "1 h 05 min" */

export function formatLateness(minutes: number): string {

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `${hours} h ${String(rest).padStart(2, "0")} min`;

}

/*
 * Walks the session's taps oldest-first and decides which one actually
 * checked each person in. Everything after that first tap is a
 * duplicate: the student is already present.
 *
 * Lateness is judged on that first tap only, so arriving late and
 * tapping again later does not make a student later.
 */

export function buildAttendance(
    rawScans: RfidScan[],
    studentMap: Record<string, Student>,
    sessionStart: string | null = null,
    graceMinutes: number = GRACE_PERIOD_MINUTES
): AttendanceSnapshot {

    const ascending = [...rawScans].sort(
        (a, b) =>
            new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime()
    );

    const entries = new Map<string, AttendanceEntry>();

    const scans: EnrichedScan[] = [];

    ascending.forEach(scan => {

        const uid = normalizeUid(scan.uid);

        const student = studentMap[uid] ?? null;

        /*
         * Keyed by student, not by card, so a replacement card for the
         * same student still counts as one person.
         */
        const key = student
            ? `student:${student.student_id}`
            : `card:${uid}`;

        const existing = entries.get(key);

        if (existing) {

            existing.scanCount += 1;
            existing.lastScanAt = scan.scanned_at;

            if (student && !existing.student) {
                existing.student = student;
            }

        } else {

            const minutesLate = minutesAfterStart(scan.scanned_at, sessionStart);

            entries.set(key, {
                key,
                student,
                uid,
                checkedInAt: scan.scanned_at,
                lastScanAt: scan.scanned_at,
                scanCount: 1,
                minutesLate,
                isLate: Boolean(sessionStart) && minutesLate > graceMinutes
            });

        }

        const entry = entries.get(key)!;

        scans.push({
            ...scan,
            uid,
            student,
            /* An unassigned card has nobody to already be present */
            isDuplicate: Boolean(existing) && Boolean(student),
            checkedInAt: entry.checkedInAt,
            /* Lateness always describes the check-in, not this tap */
            isLate: entry.isLate,
            minutesLate: entry.minutesLate
        });

    });

    const list = [...entries.values()].sort(
        (a, b) =>
            new Date(b.lastScanAt).getTime() - new Date(a.lastScanAt).getTime()
    );

    const known = list.filter(entry => entry.student);

    return {
        /* Newest first for display */
        scans: scans.reverse(),
        entries: list,
        presentCount: known.length,
        lateCount: known.filter(entry => entry.isLate).length,
        onTimeCount: known.filter(entry => !entry.isLate).length,
        unknownCount: list.filter(entry => !entry.student).length
    };

}
