/* UIDs are compared in one canonical shape everywhere */

export function normalizeUid(uid: string | null | undefined): string {
    return String(uid || "").trim().toUpperCase();
}
