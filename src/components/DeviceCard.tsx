interface DeviceCardProps {
    online: boolean;
}

export default function DeviceCard({ online }: DeviceCardProps) {

    return (

        <section className="card device-card">

            <p className="label">DEVICE</p>

            <h2>ESP32 Scanner</h2>

            <div className="device-status">

                <span className={online ? "status-dot" : "status-dot offline"} />

                <div>
                    <strong>{online ? "Connected" : "Disconnected"}</strong>

                    <small>
                        {online ? "RFID reader active" : "No response from Supabase"}
                    </small>
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
