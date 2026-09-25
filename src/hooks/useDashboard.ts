import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { normalizeUid } from "../lib/uid";
import { describeError } from "../lib/errors";
import { buildAttendance } from "../lib/attendance";
import type {
    AttendanceEntry,
    ClassSession,
    EnrichedScan,
    RfidScan,
    Student
} from "../types";

const REFRESH_MS = 1500;

/* Generous ceiling for the taps in one class session */
const SCAN_LIMIT = 500;

/*
 * A single dropped request is normal on classroom wifi. Polling every
 * 1.5s means we hear about it constantly, so only call the dashboard
 * offline once this many polls in a row have failed.
 */
const FAILURES_BEFORE_OFFLINE = 3;

export interface UseDashboardResult {
    session: ClassSession | null;
    sessionActive: boolean;
    scans: EnrichedScan[];
    entries: AttendanceEntry[];
    presentCount: number;
    lateCount: number;
    onTimeCount: number;
    unknownCount: number;
    latest: EnrichedScan | null;
    loading: boolean;
    error: string | null;
    reconnecting: boolean;
    busy: boolean;
    refresh: () => Promise<void>;
    startSession: (name: string) => Promise<string | null>;
    endSession: () => Promise<string | null>;
}

/*
 * One poll drives the whole dashboard: find the current session, then
 * load the taps that fall inside its window and fold them into a
 * register. Attendance outside a session is not counted at all.
 */

export function useDashboard(): UseDashboardResult {

    const [session, setSession] = useState<ClassSession | null>(null);
    const [scans, setScans] = useState<EnrichedScan[]>([]);
    const [entries, setEntries] = useState<AttendanceEntry[]>([]);
    const [presentCount, setPresentCount] = useState(0);
    const [lateCount, setLateCount] = useState(0);
    const [onTimeCount, setOnTimeCount] = useState(0);
    const [unknownCount, setUnknownCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [reconnecting, setReconnecting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    /* Keeps overlapping polls from stacking up on a slow network */
    const inFlight = useRef(false);

    const mounted = useRef(true);

    /* Consecutive failed polls — reset by the first one that works */
    const failures = useRef(0);

    /*
     * Last good data stays on screen through a wobble; only a sustained
     * outage swaps the dashboard into its offline state.
     */

    const reportFailure = useCallback((err: unknown) => {

        if (!mounted.current) {
            return;
        }

        failures.current += 1;

        if (failures.current >= FAILURES_BEFORE_OFFLINE) {
            setError(describeError(err));
            setReconnecting(false);
        } else {
            setReconnecting(true);
        }

    }, []);

    const reportSuccess = useCallback(() => {

        if (!mounted.current) {
            return;
        }

        failures.current = 0;
        setError(null);
        setReconnecting(false);

    }, []);

    const load = useCallback(async (): Promise<void> => {

        if (inFlight.current) {
            return;
        }

        inFlight.current = true;

        try {

            /* The newest session, running or not */

            const sessionResult = await supabase
                .from("class_sessions")
                .select("*")
                .order("started_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!mounted.current) {
                return;
            }

            if (sessionResult.error) {
                console.error("Sessions error:", sessionResult.error);
                reportFailure(sessionResult.error);
                return;
            }

            const current = (sessionResult.data as ClassSession | null) ?? null;

            setSession(current);

            if (!current) {

                setScans([]);
                setEntries([]);
                setPresentCount(0);
                setLateCount(0);
                setOnTimeCount(0);
                setUnknownCount(0);
                reportSuccess();

                return;

            }

            /* Only taps inside the session window count */

            let scanQuery = supabase
                .from("rfid_scans")
                .select("*")
                .gte("scanned_at", current.started_at);

            if (current.ended_at) {
                scanQuery = scanQuery.lte("scanned_at", current.ended_at);
            }

            const [scanResult, studentResult] = await Promise.all([

                scanQuery
                    .order("scanned_at", { ascending: false })
                    .limit(SCAN_LIMIT),

                supabase
                    .from("students")
                    .select("*")

            ]);

            if (!mounted.current) {
                return;
            }

            if (scanResult.error) {
                console.error("RFID scans error:", scanResult.error);
                reportFailure(scanResult.error);
                return;
            }

            if (studentResult.error) {
                console.error("Students error:", studentResult.error);
                reportFailure(studentResult.error);
                return;
            }

            /* UID -> student */

            const studentMap: Record<string, Student> = {};

            ((studentResult.data ?? []) as Student[]).forEach(student => {
                studentMap[normalizeUid(student.card_uid)] = student;
            });

            /* Lateness is measured from the moment the class started */

            const snapshot = buildAttendance(
                (scanResult.data ?? []) as RfidScan[],
                studentMap,
                current.started_at
            );

            setScans(snapshot.scans);
            setEntries(snapshot.entries);
            setPresentCount(snapshot.presentCount);
            setLateCount(snapshot.lateCount);
            setOnTimeCount(snapshot.onTimeCount);
            setUnknownCount(snapshot.unknownCount);
            reportSuccess();

        } catch (err) {

            console.error("Dashboard load failed:", err);

            reportFailure(err);

        } finally {

            inFlight.current = false;

            if (mounted.current) {
                setLoading(false);
            }

        }

    }, [reportFailure, reportSuccess]);

    /* Returns an error message, or null when it worked */

    const startSession = useCallback(async (name: string): Promise<string | null> => {

        const trimmed = name.trim();

        if (!trimmed) {
            return "Give the class a name first.";
        }

        setBusy(true);

        try {

            const { error: insertError } = await supabase
                .from("class_sessions")
                .insert({ name: trimmed });

            if (insertError) {

                console.error(insertError);

                /* The partial unique index rejects a second open session */
                if (insertError.code === "23505") {
                    return "A class is already running. Stop it first.";
                }

                return describeError(insertError.message);

            }

        } catch (err) {

            /* The network dropped mid-write — say so instead of throwing */
            console.error("Start session failed:", err);

            return describeError(err);

        } finally {

            if (mounted.current) {
                setBusy(false);
            }

        }

        await load();

        return null;

    }, [load]);

    const endSession = useCallback(async (): Promise<string | null> => {

        if (!session || session.ended_at) {
            return null;
        }

        setBusy(true);

        try {

            const { error: updateError } = await supabase
                .from("class_sessions")
                .update({ ended_at: new Date().toISOString() })
                .eq("id", session.id);

            if (updateError) {
                console.error(updateError);
                return describeError(updateError.message);
            }

        } catch (err) {

            console.error("Stop session failed:", err);

            return describeError(err);

        } finally {

            if (mounted.current) {
                setBusy(false);
            }

        }

        await load();

        return null;

    }, [session, load]);

    useEffect(() => {

        mounted.current = true;

        void load();

        const timer = window.setInterval(() => void load(), REFRESH_MS);

        return () => {
            mounted.current = false;
            window.clearInterval(timer);
        };

    }, [load]);

    return {
        session,
        sessionActive: Boolean(session && !session.ended_at),
        scans,
        entries,
        presentCount,
        lateCount,
        onTimeCount,
        unknownCount,
        latest: scans[0] ?? null,
        loading,
        error,
        reconnecting,
        busy,
        refresh: load,
        startSession,
        endSession
    };

}
