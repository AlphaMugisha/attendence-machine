import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { ClassSession } from "../types";

function clockTime(value: string): string {

    return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

/* hh:mm:ss between two instants */

function formatElapsed(fromIso: string, toMs: number): string {

    const seconds = Math.max(
        0,
        Math.floor((toMs - new Date(fromIso).getTime()) / 1000)
    );

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;

}

interface SessionCardProps {
    session: ClassSession | null;
    active: boolean;
    busy: boolean;
    onStart: (name: string) => Promise<string | null>;
    onStop: () => Promise<string | null>;
}

export default function SessionCard({
    session,
    active,
    busy,
    onStart,
    onStop
}: SessionCardProps) {

    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    /* Ticks the running clock once a second */
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {

        if (!active) {
            return;
        }

        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);

    }, [active]);

    async function handleStart(event: FormEvent<HTMLFormElement>) {

        event.preventDefault();

        const message = await onStart(name);

        setError(message);

        if (!message) {
            setName("");
        }

    }

    async function handleStop() {

        const message = await onStop();

        setError(message);

    }

    /* RUNNING */

    if (active && session) {

        return (

            <section className="card session-card is-running">

                <div className="card-header">

                    <div>
                        <p className="label">CLASS IN SESSION</p>
                        <h2>{session.name}</h2>
                    </div>

                    <span className="live-pill">
                        <span className="status-dot" />
                        LIVE
                    </span>

                </div>

                <div className="session-clock">
                    {formatElapsed(session.started_at, now)}
                </div>

                <p className="session-since">
                    Started at {clockTime(session.started_at)}
                </p>

                {error && <p className="form-error">{error}</p>}

                <button
                    type="button"
                    className="stop-button"
                    onClick={() => void handleStop()}
                    disabled={busy}
                >
                    {busy ? "Stopping..." : "Stop Class"}
                </button>

            </section>

        );

    }

    /* IDLE — show how the last one ended, and offer a new start */

    return (

        <section className="card session-card">

            <div className="card-header">

                <div>
                    <p className="label">NO CLASS RUNNING</p>
                    <h2>Start a Class</h2>
                </div>

            </div>

            {session && (

                <div className="last-session">

                    <span>Last class</span>

                    <strong>{session.name}</strong>

                    <small>
                        {clockTime(session.started_at)}
                        {session.ended_at
                            ? ` – ${clockTime(session.ended_at)}`
                            : ""}
                    </small>

                </div>

            )}

            <form onSubmit={handleStart} className="session-form">

                <div className="form-group">

                    <label htmlFor="sessionName">
                        Class name
                    </label>

                    <input
                        type="text"
                        id="sessionName"
                        placeholder="e.g. Maths — Year 1 CS"
                        value={name}
                        onChange={event => setName(event.target.value)}
                        required
                    />

                </div>

                {error && <p className="form-error">{error}</p>}

                <button
                    type="submit"
                    className="save-button"
                    disabled={busy}
                >
                    {busy ? "Starting..." : "Start Class"}
                </button>

            </form>

        </section>

    );

}
