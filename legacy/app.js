const SUPABASE_URL = "https://muejplustswegkojbrbd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWpwbHVzdHN3ZWdrb2picmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyOTQwODQsImV4cCI6MjEwNTg3MDA4NH0.E1O--YgBk9f7UHpHE1qRYLSOArfl-AWQQ-e9oH9iiFs";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentUid = null;
let lastScanId = null;


/* LOAD SCANS */

async function loadScans() {

    const { data: scans, error } = await supabaseClient
        .from("rfid_scans")
        .select("*")
        .order("scanned_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("RFID scans error:", error);
        return;
    }

    if (!scans || scans.length === 0) {
        return;
    }


    /* GET STUDENTS */

    const { data: students, error: studentError } = await supabaseClient
        .from("students")
        .select("*");

    if (studentError) {
        console.error("Students error:", studentError);
        return;
    }


    /* CREATE UID → STUDENT MAP */

    const studentMap = {};

    students.forEach(student => {

        const uid = student.card_uid
            .trim()
            .toUpperCase();

        studentMap[uid] = student;

    });


    /* LATEST SCAN */

    const latest = scans[0];

    const uid = latest.uid
        .trim()
        .toUpperCase();

    const student = studentMap[uid];


    /* UPDATE LATEST SCAN */

    document.getElementById("latestTime").textContent =
        new Date(latest.scanned_at).toLocaleString();


    if (student) {

        /* CARD IS ASSIGNED */

        document.getElementById("latestTitle").textContent =
            "Student Detected";

        document.getElementById("studentCard")
            .classList.remove("hidden");

        document.getElementById("unknownCard")
            .classList.add("hidden");

        document.getElementById("latestStudentName")
            .textContent = student.name;

        document.getElementById("latestStudentId")
            .textContent = student.student_id;

        document.getElementById("latestClass")
            .textContent = student.class_name;

    } else {

        /* CARD IS NOT ASSIGNED */

        document.getElementById("latestTitle").textContent =
            "New Card Detected";

        document.getElementById("studentCard")
            .classList.add("hidden");

        document.getElementById("unknownCard")
            .classList.remove("hidden");

        document.getElementById("latestUid")
            .textContent = uid;

        currentUid = uid;

    }


    /* RECENT SCANS */

    const scanList = document.getElementById("scanList");

    scanList.innerHTML = "";

    scans.forEach(scan => {

        const scanUid = scan.uid
            .trim()
            .toUpperCase();

        const scanStudent = studentMap[scanUid];

        const scanDiv = document.createElement("div");

        scanDiv.className = "scan";


        const info = document.createElement("div");

        const name = document.createElement("span");

        name.className = "scan-name";

        name.textContent =
            scanStudent
                ? scanStudent.name
                : "Unassigned Card";


        const uidText = document.createElement("span");

        uidText.className = "scan-uid";

        uidText.textContent = scanUid;


        const time = document.createElement("small");

        time.textContent =
            new Date(scan.scanned_at).toLocaleString();


        info.appendChild(name);
        info.appendChild(uidText);
        info.appendChild(time);


        const status = document.createElement("span");

        status.className =
            scanStudent
                ? "scan-status"
                : "scan-status unassigned-status";

        status.textContent =
            scanStudent
                ? "PRESENT"
                : "UNASSIGNED";


        scanDiv.appendChild(info);
        scanDiv.appendChild(status);

        scanList.appendChild(scanDiv);

    });

}


/* OPEN ASSIGN MODAL */

document.getElementById("assignButton")
    .addEventListener("click", function () {

        if (!currentUid) {
            return;
        }

        document.getElementById("modalUid")
            .textContent = currentUid;

        document.getElementById("assignModal")
            .classList.remove("hidden");

    });


/* CLOSE MODAL */

document.getElementById("closeModal")
    .addEventListener("click", function () {

        document.getElementById("assignModal")
            .classList.add("hidden");

    });


/* SAVE STUDENT */

document.getElementById("studentForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const name =
            document.getElementById("studentName")
                .value
                .trim();

        const studentId =
            document.getElementById("studentId")
                .value
                .trim();

        const className =
            document.getElementById("className")
                .value
                .trim();


        if (!currentUid) {
            alert("No RFID card detected.");
            return;
        }


        const button =
            document.getElementById("saveStudentButton");

        button.disabled = true;

        button.textContent = "Saving...";


        const { error } = await supabaseClient
            .from("students")
            .insert({

                name: name,

                student_id: studentId,

                class_name: className,

                card_uid: currentUid

            });


        if (error) {

            console.error(error);

            alert(
                "Could not save student:\n" +
                error.message
            );

            button.disabled = false;

            button.textContent = "Save Student";

            return;

        }


        alert("Student assigned successfully!");


        /* CLOSE MODAL */

        document.getElementById("assignModal")
            .classList.add("hidden");


        /* CLEAR FORM */

        document.getElementById("studentForm")
            .reset();


        button.disabled = false;

        button.textContent = "Save Student";


        /* REFRESH DASHBOARD */

        await loadScans();

    });


/* INITIAL LOAD */

loadScans();


/* AUTOMATIC REFRESH */

setInterval(() => {

    loadScans();

}, 1500);