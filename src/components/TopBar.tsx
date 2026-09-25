import type { ClassSession } from "../types";

interface TopBarProps {
    online: boolean;
    reconnecting: boolean;
    presentCount: number;
    lateCount: number;
    session: ClassSession | null;
    sessionActive: boolean;
}

export default function TopBar({
    online,
    reconnecting,
    presentCount,
    lateCount,
    session,
    sessionActive
}: TopBarProps) {

    const today = new Date().toLocaleDateString([], {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    const subtitle = sessionActive && session
        ? `${session.name} · ${presentCount} present`
            + (lateCount > 0 ? `, ${lateCount} late` : "")
        : `${today} · no class running`;

    /* A wobble reads as "reconnecting"; only a sustained outage is offline */

    const connectionClass = !online
        ? "connection-dot offline"
        : reconnecting
            ? "connection-dot waiting"
            : "connection-dot";

    const connectionText = !online
        ? "Connection Lost"
        : reconnecting
            ? "Reconnecting..."
            : "System Online";

    return (

        <header className="topbar">

            <div>
                <p className="eyebrow">SMART ATTENDANCE</p>

                <h1>RFID Attendance</h1>

                <p className="subtitle">{subtitle}</p>
            </div>

            <div className="connection">
                <span className={connectionClass} />
                <span>{connectionText}</span>
            </div>

        </header>

    );

}
