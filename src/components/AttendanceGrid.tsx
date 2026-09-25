import { formatLateness } from "../lib/attendance";
import type { AttendanceEntry, ClassSession } from "../types";

function formatTime(value: string): string {

    return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

function initials(name: string): string {

    const parts = name.trim().split(/\s+/).slice(0, 2);

    return parts.map(part => part.charAt(0).toUpperCase()).join("") || "?";

}

interface AttendanceGridProps {
    entries: AttendanceEntry[];
    presentCount: number;
    lateCount: number;
    session: ClassSession | null;
    sessionActive: boolean;
    onAssign: (uid: string) => void;
}

export default function AttendanceGrid({
    entries,
    presentCount,
    lateCount,
    session,
    sessionActive,
    onAssign
}: AttendanceGridProps) {

    const heading = session
        ? session.name
        : "Attendance Register";

    const emptyText = !session
        ? "Start a class to open the register."
        : sessionActive
            ? "No one has scanned in yet."
            : "Nobody checked in during this class.";

    return (

        <section className="card history-card">

            <div className="card-header">

                <div>
                    <p className="label">
                        {sessionActive ? "REGISTER · IN SESSION" : "REGISTER · CLOSED"}
                    </p>
                    <h2>{heading}</h2>
                </div>

                <div className="header-stats">

                    <div className="stat">
                        <strong>{presentCount}</strong>
                        <span>Present</span>
                    </div>

                    <div className={lateCount > 0 ? "stat is-late" : "stat"}>
                        <strong>{lateCount}</strong>
                        <span>Late</span>
                    </div>

                    <div className={sessionActive ? "scan-count" : "scan-count is-closed"}>
                        {sessionActive ? "LIVE" : "FINAL"}
                    </div>

                </div>

            </div>

            {entries.length === 0 ? (

                <div className="empty">
                    {emptyText}
                </div>

            ) : (

                <div className="attendance-grid">

                    {entries.map(entry => {

                        const student = entry.student;

                        return (

                            <article
                                className={
                                    !student
                                        ? "attendance-tile is-unassigned"
                                        : entry.isLate
                                            ? "attendance-tile is-late"
                                            : "attendance-tile"
                                }
                                key={entry.key}
                            >

                                <div className="tile-top">

                                    <div className="avatar">
                                        {student ? initials(student.name) : "?"}
                                    </div>

                                    <span
                                        className={
                                            !student
                                                ? "scan-status unassigned-status"
                                                : entry.isLate
                                                    ? "scan-status late-status"
                                                    : "scan-status"
                                        }
                                    >
                                        {!student
                                            ? "UNASSIGNED"
                                            : entry.isLate
                                                ? "LATE"
                                                : "ON TIME"}
                                    </span>

                                </div>

                                <h3 className="tile-name">
                                    {student ? student.name : "Unassigned Card"}
                                </h3>

                                <p className="tile-meta">
                                    {student
                                        ? `${student.student_id} · ${student.class_name}`
                                        : entry.uid}
                                </p>

                                <div className="tile-footer">

                                    <div>
                                        <span>
                                            {entry.isLate ? "Arrived" : "Checked in"}
                                        </span>
                                        <strong>{formatTime(entry.checkedInAt)}</strong>
                                    </div>

                                    {entry.scanCount > 1 && (
                                        <span
                                            className="repeat-chip"
                                            title={
                                                "Last tap at " +
                                                formatTime(entry.lastScanAt)
                                            }
                                        >
                                            {entry.scanCount} taps
                                        </span>
                                    )}

                                </div>

                                {entry.isLate && (
                                    <p className="late-line">
                                        Late by {formatLateness(entry.minutesLate)}
                                    </p>
                                )}

                                {!student && (
                                    <button
                                        type="button"
                                        className="tile-assign"
                                        onClick={() => onAssign(entry.uid)}
                                    >
                                        + Assign to Student
                                    </button>
                                )}

                            </article>

                        );

                    })}

                </div>

            )}

        </section>

    );

}
