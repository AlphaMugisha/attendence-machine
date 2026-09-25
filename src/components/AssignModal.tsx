import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";

import { supabase } from "../lib/supabaseClient";

interface AssignForm {
    name: string;
    studentId: string;
    className: string;
}

const EMPTY_FORM: AssignForm = {
    name: "",
    studentId: "",
    className: ""
};

interface AssignModalProps {
    uid: string;
    onClose: () => void;
    onSaved: () => void;
}

export default function AssignModal({ uid, onClose, onSaved }: AssignModalProps) {

    const [form, setForm] = useState<AssignForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Escape closes the modal */

    useEffect(() => {

        function onKeyDown(event: KeyboardEvent) {

            if (event.key === "Escape" && !saving) {
                onClose();
            }

        }

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);

    }, [onClose, saving]);

    function updateField(field: keyof AssignForm) {

        return (event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            setForm(previous => ({ ...previous, [field]: value }));
        };

    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {

        event.preventDefault();

        if (!uid) {
            setError("No RFID card detected.");
            return;
        }

        setSaving(true);
        setError(null);

        const { error: insertError } = await supabase
            .from("students")
            .insert({
                name: form.name.trim(),
                student_id: form.studentId.trim(),
                class_name: form.className.trim(),
                card_uid: uid
            });

        setSaving(false);

        if (insertError) {
            console.error(insertError);
            setError("Could not save student: " + insertError.message);
            return;
        }

        setForm(EMPTY_FORM);

        onSaved();

    }

    function handleBackdrop(event: MouseEvent<HTMLDivElement>) {

        if (event.target === event.currentTarget && !saving) {
            onClose();
        }

    }

    return (

        <div className="modal" onMouseDown={handleBackdrop}>

            <div className="modal-content">

                <div className="modal-header">

                    <div>
                        <p className="label">NEW RFID CARD</p>

                        <h2>Assign Card</h2>
                    </div>

                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <p className="modal-description">
                    Assign this RFID card to a student. The next time
                    the card is scanned, the student&apos;s name will appear.
                </p>


                <div className="detected-card">

                    <span>Card UID</span>

                    <strong>{uid || "--"}</strong>

                </div>


                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="studentName">
                            Student Name
                        </label>

                        <input
                            type="text"
                            id="studentName"
                            placeholder="e.g. Alpha Mugisha"
                            value={form.name}
                            onChange={updateField("name")}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="studentId">
                            Student ID
                        </label>

                        <input
                            type="text"
                            id="studentId"
                            placeholder="e.g. NGA001"
                            value={form.studentId}
                            onChange={updateField("studentId")}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="className">
                            Class
                        </label>

                        <input
                            type="text"
                            id="className"
                            placeholder="e.g. Year 1 Computer Science"
                            value={form.className}
                            onChange={updateField("className")}
                            required
                        />

                    </div>


                    {error && (
                        <p className="form-error">{error}</p>
                    )}


                    <button
                        type="submit"
                        className="save-button"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Student"}
                    </button>

                </form>

            </div>

        </div>

    );

}
