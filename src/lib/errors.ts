/*
 * fetch() rejects with a bare "Failed to fetch" when the network is
 * unreachable. That is a true statement and a useless one, so say
 * something the person standing at the reader can act on. Real
 * database errors are passed through untouched.
 */

export function describeError(err: unknown): string {

    const message = err instanceof Error ? err.message : String(err);

    if (/failed to fetch|networkerror|load failed/i.test(message)) {
        return "Can't reach Supabase — check the internet connection.";
    }

    return message;

}
