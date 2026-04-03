"""
Gemini-backed patient chatbot with lightweight medical safety guardrails.
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import Any
from urllib import error, request

from config import settings


logger = logging.getLogger(__name__)


SYSTEM_INSTRUCTIONS = """You are Healio Assistant, a calm and supportive in-app health helper for patients.

Rules you must always follow:
- You are informational only and never replace a doctor.
- Do not diagnose conditions or claim certainty about what a symptom means.
- Do not say the user has or does not have a disease.
- Do not tell the user to start, stop, increase, or decrease medication doses.
- Do not provide emergency triage beyond telling the user to contact their doctor or seek urgent or emergency care.
- Keep replies concise, practical, and reassuring.
- If the user asks diagnostic or medication-change questions, explain the limitation and encourage contacting their clinician.
- If context is provided, use it carefully and only refer to what is present in the provided data.
"""

STARTER_DISCLAIMER = (
    "I can help explain your Healio information and suggest questions to ask your doctor, "
    "but I cannot diagnose conditions or change treatment decisions."
)

HIGH_RISK_PATTERNS: dict[str, tuple[str, list[str]]] = {
    "emergency": (
        "This could be urgent. Please seek emergency care right away or call your local emergency number now.",
        [
            "chest pain",
            "can't breathe",
            "cannot breathe",
            "trouble breathing",
            "shortness of breath",
            "passing out",
            "fainted",
            "fainting",
            "severe bleeding",
            "stroke",
            "heart attack",
            "one side numb",
            "slurred speech",
        ],
    ),
    "mental_health": (
        "Please contact emergency services or a crisis hotline right away, and reach out to a trusted person or your doctor now.",
        [
            "suicide",
            "kill myself",
            "end my life",
            "self harm",
            "hurt myself",
            "want to die",
        ],
    ),
    "doctor_contact": (
        "I can't guide medication changes or diagnose this. Please contact your doctor or pharmacist for advice specific to you.",
        [
            "should i stop taking",
            "should i start taking",
            "should i change my dose",
            "double my dose",
            "skip my medication",
            "take extra",
            "do i have",
            "is this diagnosis",
        ],
    ),
}


def screen_for_risk(message: str) -> tuple[bool, str | None]:
    """Return escalation signal and response when risky wording is present."""
    normalized = (message or "").strip().lower()
    if not normalized:
        return False, None

    for _, (response, phrases) in HIGH_RISK_PATTERNS.items():
        if any(phrase in normalized for phrase in phrases):
            return True, response

    return False, None


async def build_context(db, user: dict, context_types: list[str]) -> tuple[list[str], str]:
    """Load explicitly requested patient-owned context for prompt building."""
    if not context_types:
        return [], ""

    user_id = str(user["_id"])
    used_context: list[str] = []
    sections: list[str] = []

    if "vitals" in context_types:
        metric_types = [
            "heart_rate",
            "blood_glucose",
            "blood_pressure_systolic",
            "blood_pressure_diastolic",
            "sleep_hours",
            "blood_oxygen",
            "body_temperature",
            "weight",
        ]
        vital_lines: list[str] = []
        for metric in metric_types:
            latest = await db.biometrics.find_one(
                {"user_id": user_id, "metric": metric},
                sort=[("timestamp", -1)]
            )
            if latest:
                vital_lines.append(
                    f"- {metric}: {latest.get('value')} at {format_dt(latest.get('timestamp'))}"
                )
        if vital_lines:
            used_context.append("vitals")
            sections.append("Recent vitals:\n" + "\n".join(vital_lines))

    if "medications" in context_types:
        medications = await db.medications.find(
            {"user_id": user_id, "active": True}
        ).sort("created_at", -1).to_list(length=5)
        if medications:
            used_context.append("medications")
            lines = [
                f"- {med.get('name')} {med.get('dosage')} | {med.get('frequency')} | {med.get('instructions') or med.get('time_of_day') or 'No extra instructions'}"
                for med in medications
            ]
            sections.append("Active medications:\n" + "\n".join(lines))

    if "appointments" in context_types:
        appointments = await db.appointments.find(
            {"user_id": user_id, "status": "upcoming"}
        ).sort("date", 1).to_list(length=5)
        if appointments:
            used_context.append("appointments")
            lines = [
                f"- {appt.get('title')} on {appt.get('date')} at {appt.get('time')} with {appt.get('doctor') or 'unspecified clinician'}"
                for appt in appointments
            ]
            sections.append("Upcoming appointments:\n" + "\n".join(lines))

    if "reminders" in context_types:
        reminders = await db.reminders.find(
            {"user_id": user_id, "active": True}
        ).sort("created_at", -1).to_list(length=5)
        if reminders:
            used_context.append("reminders")
            lines = [
                f"- {reminder.get('title')} at {reminder.get('time')} ({reminder.get('frequency')})"
                for reminder in reminders
            ]
            sections.append("Active reminders:\n" + "\n".join(lines))

    return used_context, "\n\n".join(sections)


def build_prompt(message: str, conversation: list[dict[str, str]], context_block: str) -> str:
    """Assemble the final prompt sent to Gemini."""
    history_lines = []
    for item in conversation[-8:]:
        role = item.get("role", "user").strip().lower()
        text = item.get("text", "").strip()
        if role in {"user", "assistant"} and text:
            history_lines.append(f"{role.title()}: {text}")

    pieces = [
        SYSTEM_INSTRUCTIONS,
        f"Patient message:\n{message.strip()}",
    ]

    if history_lines:
        pieces.append("Conversation so far:\n" + "\n".join(history_lines))

    if context_block:
        pieces.append("Patient context supplied by Healio:\n" + context_block)

    pieces.append(
        "Respond with plain helpful text only. Keep it concise. "
        "If the user asks for diagnosis or medication changes, state the limitation and encourage contacting their doctor."
    )
    return "\n\n".join(pieces)


async def generate_chatbot_reply(
    db,
    user: dict,
    message: str,
    conversation: list[dict[str, str]],
    context_types: list[str],
) -> dict[str, Any]:
    """Return a safe chatbot response, escalating when needed."""
    should_escalate, escalation_message = screen_for_risk(message)
    if should_escalate and escalation_message:
        return {
            "reply": f"{STARTER_DISCLAIMER} {escalation_message}",
            "should_escalate": True,
            "escalation_message": escalation_message,
            "used_context": [],
        }

    used_context, context_block = await build_context(db, user, context_types)

    if not settings.gemini_api_key:
        return {
            "reply": (
                "The Healio assistant is not configured yet. Add a Gemini API key on the backend to enable chat."
            ),
            "should_escalate": False,
            "escalation_message": None,
            "used_context": used_context,
        }

    prompt = build_prompt(message, conversation, context_block)
    reply_text = await call_gemini(prompt)

    return {
        "reply": reply_text,
        "should_escalate": False,
        "escalation_message": None,
        "used_context": used_context,
    }


async def call_gemini(prompt: str) -> str:
    """Call Gemini using the public REST API."""
    api_url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 350,
        },
    }

    def _make_request() -> str:
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            api_url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=settings.gemini_timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Gemini request failed: {detail or exc.reason}") from exc
        except error.URLError as exc:
            raise RuntimeError("Unable to reach Gemini right now.") from exc

        parsed = json.loads(raw)
        candidates = parsed.get("candidates") or []
        if not candidates:
            raise RuntimeError("Gemini returned no response.")

        parts = candidates[0].get("content", {}).get("parts", [])
        text_chunks = [part.get("text", "").strip() for part in parts if part.get("text")]
        if not text_chunks:
            raise RuntimeError("Gemini returned an empty response.")

        return " ".join(text_chunks).strip()

    try:
        return await asyncio.to_thread(_make_request)
    except RuntimeError as exc:
        logger.warning("Gemini request failed: %s", exc)
        return (
            "I’m having trouble reaching the Healio assistant right now. "
            "Please try again in a moment or contact your doctor for medical guidance."
        )


def format_dt(value: Any) -> str:
    """Render date values for compact prompt context."""
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value or "unknown time")
