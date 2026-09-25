import { useEffect, useState } from "react";

import TopBar from "./components/TopBar";
import LatestScanCard from "./components/LatestScanCard";
import SessionCard from "./components/SessionCard";
import DeviceCard from "./components/DeviceCard";
import AttendanceGrid from "./components/AttendanceGrid";
import AssignModal from "./components/AssignModal";

import { useDashboard } from "./hooks/useDashboard";

export default function App() {

    const {
        session,
        sessionActive,
        entries,
        latest,
        presentCount,
        lateCount,
        error,
        reconnecting,
        busy,
        refresh,
        startSession,
        endSession
    } = useDashboard();

    /*
     * The UID is frozen when the modal opens, so a scan arriving
     * mid-form cannot swap the card being assigned.
     */
    const [assigningUid, setAssigningUid] = useState<string | null>(null);

    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {

        if (!toast) {
            return;
        }

        const timer = window.setTimeout(() => setToast(null), 2500);

        return () => window.clearTimeout(timer);

    }, [toast]);

    const online = !error;

    async function handleSaved() {

        setAssigningUid(null);
        setToast("Student assigned successfully!");

        await refresh();

    }

    return (

        <>

            <div className="dashboard">

                <TopBar
                    online={online}
                    reconnecting={reconnecting}
                    presentCount={presentCount}
                    lateCount={lateCount}
                    session={session}
                    sessionActive={sessionActive}
                />

                <main className="grid">

                    <LatestScanCard
                        latest={latest}
                        sessionActive={sessionActive}
                        onAssign={() => {
                            if (latest && !latest.student) {
                                setAssigningUid(latest.uid);
                            }
                        }}
                    />

                    <div className="side-column">

                        <SessionCard
                            session={session}
                            active={sessionActive}
                            busy={busy}
                            onStart={startSession}
                            onStop={endSession}
                        />

                        <DeviceCard
                            online={online}
                            reconnecting={reconnecting}
                            error={error}
                        />

                    </div>

                    <AttendanceGrid
                        entries={entries}
                        presentCount={presentCount}
                        lateCount={lateCount}
                        session={session}
                        sessionActive={sessionActive}
                        onAssign={uid => setAssigningUid(uid)}
                    />

                </main>

                <footer>
                    RFID Attendance System · ESP32 + Supabase
                </footer>

            </div>

            {assigningUid && (
                <AssignModal
                    uid={assigningUid}
                    onClose={() => setAssigningUid(null)}
                    onSaved={() => void handleSaved()}
                />
            )}

            {toast && (
                <div className="toast">{toast}</div>
            )}

        </>

    );

}
