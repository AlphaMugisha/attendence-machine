import type { ClassSession } from "../types";

interface TopBarProps {
    online: boolean;
    presentCount: number;
    session: ClassSession | null;
    sessionActive: boolean;
}

export default function TopBar({
    online,
    presentCount,
    session,
    sessionActive
}: TopBarProps) {

    const today = new Date().toLocaleDateString([], {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    const subtitle = sessionActive && session
        ? `${session.name} · ${presentCount} ${presentCount === 1 ? "student" : "students"} present`
        : `${today} · no class running`;

    return (

        <header className="topbar">

            <div>
                <p className="eyebrow">SMART ATTENDANCE</p>

                <h1>RFID Attendance</h1>

                <p className="subtitle">{subtitle}</p>
            </div>

            <div className="connection">
                <span className={online ? "connection-dot" : "connection-dot offline"} />
                <span>{online ? "System Online" : "Connection Lost"}</span>
            </div>

        </header>

    );

}
