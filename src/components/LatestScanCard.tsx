import { formatLateness } from "../lib/attendance";
import type { EnrichedScan } from "../types";

function formatTime(value: string | undefined | null): string {

    if (!value) {
        return "--";
    }

    return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

function formatFull(value: string | undefined | null): string {

    if (!value) {
        return "--";
    }

    return new Date(value).toLocaleString();

}

interface LatestScanCardProps {
    latest: EnrichedScan | null;
    sessionActive: boolean;
    onAssign: () => void;
}

export default function LatestScanCard({
    latest,
    sessionActive,
    onAssign
}: LatestScanCardProps) {

    const student = latest?.student ?? null;

    const duplicate = Boolean(latest?.isDuplicate);

    const late = Boolean(latest?.isLate);

    const title = !sessionActive
        ? "Class not running"
        : !latest
            ? "Waiting for card"
            : !student
                ? "New Card Detected"
                : duplicate
                    ? "Already Present"
                    : late
                        ? "Marked Late"
                        : "Student Detected";

    const cardClass = !sessionActive
        ? "card latest-card"
        : duplicate
            ? "card latest-card is-duplicate"
            : late
                ? "card latest-card is-late"
                : "card latest-card";

    return (

        <section className={cardClass}>

            <div className="card-header">

                <div>
                    <p className="label">LATEST SCAN</p>
                    <h2>{title}</h2>
                </div>

                <div className="icon">
                    RFID
                </div>

            </div>


            {/* NO SESSION — taps are ignored until a class starts */}

            {!sessionActive && (

                <div className="idle-notice">

                    <strong>Attendance is not being recorded</strong>

                    <span>
                        Start a class to begin checking students in.
                        Cards tapped now are not counted.
                    </span>

                </div>

            )}


            {/* UNKNOWN CARD */}

            {sessionActive && latest && !student && (

                <div className="unknown-card">

                    <p className="uid-label">CARD UID</p>

                    <h3>{latest.uid}</h3>

                    <p className="unknown-text">
                        This card has not been assigned to a student yet.
                    </p>

                    <button
                        type="button"
                        className="assign-button"
                        onClick={onAssign}
                    >
                        + Assign to Student
                    </button>

                </div>

            )}


            {/* ASSIGNED STUDENT */}

            {sessionActive && student && (

                <div className="student-card">

                    <p className="student-label">STUDENT</p>

                    <h3>{student.name}</h3>

                    <div className="student-details">

                        <div>
                            <span>Student ID</span>
                            <strong>{student.student_id}</strong>
                        </div>

                        <div>
                            <span>Class</span>
                            <strong>{student.class_name}</strong>
                        </div>

                    </div>

                    {duplicate ? (

                        <div className="duplicate-notice">

                            <strong>Student already present</strong>

                            <span>
                                Checked in at {formatTime(latest?.checkedInAt)}
                                {late
                                    ? `, late by ${formatLateness(latest?.minutesLate ?? 0)}`
                                    : ""}
                                . This tap was not recorded again.
                            </span>

                        </div>

                    ) : late ? (

                        <div className="late-notice">

                            <strong>
                                Late by {formatLateness(latest?.minutesLate ?? 0)}
                            </strong>

                            <span>
                                Class started before this check-in.
                                Marked present, but late.
                            </span>

                        </div>

                    ) : (

                        <div className="attendance-status">
                            <span className="status-dot" />
                            <strong>ON TIME</strong>
                        </div>

                    )}

                </div>

            )}


            {/* SCAN TIME */}

            <div className="scan-time">

                <span>Scanned at</span>

                <strong>
                    {sessionActive ? formatFull(latest?.scanned_at) : "--"}
                </strong>

            </div>

        </section>

    );

}
