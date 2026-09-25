/* Rows as they come out of Supabase */

export interface Student {
    id?: number | string;
    name: string;
    student_id: string;
    class_name: string;
    card_uid: string;
}

export interface RfidScan {
    id?: number | string;
    uid: string;
    scanned_at: string;
}

/*
 * A class session: attendance is scoped to the window between
 * started_at and ended_at. A null ended_at means it is still running.
 */

export interface ClassSession {
    id: number | string;
    name: string;
    started_at: string;
    ended_at: string | null;
}

/*
 * A scan joined against the students table by card UID.
 *
 * `isDuplicate` marks a scan that arrived after the student was
 * already checked in for this session — the reader still logs every
 * tap, but only the first one counts as attendance.
 */

export interface EnrichedScan extends RfidScan {
    student: Student | null;
    isDuplicate: boolean;
    checkedInAt: string;
    isLate: boolean;
    minutesLate: number;
}

/*
 * One card per person for the session: the register, not the tap log.
 *
 * `minutesLate` counts from the moment the class started, and is set
 * even when the student was inside the grace period — `isLate` is the
 * flag that decides how they are marked.
 */

export interface AttendanceEntry {
    key: string;
    student: Student | null;
    uid: string;
    checkedInAt: string;
    lastScanAt: string;
    scanCount: number;
    minutesLate: number;
    isLate: boolean;
}

export interface AttendanceSnapshot {
    scans: EnrichedScan[];
    entries: AttendanceEntry[];
    presentCount: number;
    lateCount: number;
    onTimeCount: number;
    unknownCount: number;
}
