const SUPABASE_URL = "https://muejplustswegkojbrbd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWpwbHVzdHN3ZWdrb2picmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyOTQwODQsImV4cCI6MjEwNTg3MDA4NH0.E1O--YgBk9f7UHpHE1qRYLSOArfl-AWQQ-e9oH9iiFs";

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