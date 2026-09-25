import { normalizeUid } from "./uid";
import type {
    AttendanceEntry,
    AttendanceSnapshot,
    EnrichedScan,
    RfidScan,
    Student
} from "../types";

/*
 * Walks the session's taps oldest-first and decides which one actually
 * checked each person in. Everything after that first tap is a
 * duplicate: the student is already present.
 */

export function buildAttendance(
    rawScans: RfidScan[],
    studentMap: Record<string, Student>
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

            entries.set(key, {
                key,
                student,
                uid,
                checkedInAt: scan.scanned_at,
                lastScanAt: scan.scanned_at,
                scanCount: 1
            });

        }

        scans.push({
            ...scan,
            uid,
            student,
            /* An unassigned card has nobody to already be present */
            isDuplicate: Boolean(existing) && Boolean(student),
            checkedInAt: existing ? existing.checkedInAt : scan.scanned_at
        });

    });

    const list = [...entries.values()].sort(
        (a, b) =>
            new Date(b.lastScanAt).getTime() - new Date(a.lastScanAt).getTime()
    );

    return {
        /* Newest first for display */
        scans: scans.reverse(),
        entries: list,
        presentCount: list.filter(entry => entry.student).length,
        unknownCount: list.filter(entry => !entry.student).length
    };

}
