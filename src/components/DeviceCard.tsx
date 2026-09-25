interface DeviceCardProps {
    online: boolean;
    reconnecting: boolean;
    error: string | null;
}

export default function DeviceCard({ online, reconnecting, error }: DeviceCardProps) {

    const dotClass = !online
        ? "status-dot offline"
        : reconnecting
            ? "status-dot waiting"
            : "status-dot";

    const heading = !online
        ? "Disconnected"
        : reconnecting
            ? "Reconnecting"
            : "Connected";

    /* When it breaks, show what broke rather than a generic status line */

    const detail = !online
        ? error ?? "No response from Supabase"
        : reconnecting
            ? "A poll was dropped, retrying"
            : "RFID reader active";

    return (

        <section className="card device-card">

            <p className="label">DEVICE</p>

            <h2>ESP32 Scanner</h2>

            <div className="device-status">

                <span className={dotClass} />

                <div>
                    <strong>{heading}</strong>

                    <small>{detail}</small>
                </div>

            </div>

            <div className="device-info">

                <div>
                    <span>Connection</span>
                    <strong>Wi-Fi</strong>
                </div>

                <div>
                    <span>Database</span>
                    <strong>Supabase</strong>
                </div>

            </div>

        </section>

    );

}
