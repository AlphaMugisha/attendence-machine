const SUPABASE_URL = "PASTE_YOUR_PROJECT_URL_HERE";
const SUPABASE_KEY = "PASTE_YOUR_PUBLISHABLE_KEY_HERE";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadScans() {
    const { data, error } = await supabaseClient
        .from("rfid_scans")
        .select("*")
        .order("scanned_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Supabase error:", error);
        return;
    }

    if (data.length === 0) {
        document.getElementById("latestUid").textContent = "Waiting for card...";
        document.getElementById("scanList").innerHTML = "<p>No scans yet.</p>";
        return;
    }

    const latest = data[0];

    document.getElementById("latestUid").textContent = latest.uid;
    document.getElementById("latestTime").textContent =
        new Date(latest.scanned_at).toLocaleString();

    document.getElementById("scanList").innerHTML = data.map(scan => `
        <div class="scan">
            <strong>${scan.uid}</strong>
            <small>${new Date(scan.scanned_at).toLocaleString()}</small>
        </div>
    `).join("");
}

loadScans();