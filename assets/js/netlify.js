const API_BASE = "https://rmgreatservices.netlify.app";
const CONTACT_ENDPOINT = `${API_BASE}/.netlify/functions/contact`;

function newRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function log(level, eventName, details = {}) {
  // Netlify captures stdout/stderr, so console.log works.
  // Use JSON logs so you can search by fields.
  const entry = {
    ts: new Date().toISOString(),
    level,              // "info" | "warn" | "error"
    event: eventName,   // e.g. "contact.received"
    ...details
  };

  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function maskEmail(email) {
  const e = String(email || "");
  const at = e.indexOf("@");
  if (at <= 1) return "***";
  return e.slice(0, 2) + "***" + e.slice(at);
}

function getClientIp(event) {
  return (
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["client-ip"] ||
    ""
  );
}

async function submitContactForm(e) {
  const reqId = newRequestId();
  
  e.preventDefault();

  const form = e.target;

  const payload = {
    name: form.name.value,
    email: form.email.value,
    subject: form.subject?.value || "",
    phone: form.phone?.value || "",
    message: form.message.value,
    website: form.website?.value || "" // honeypot
  };

  log("info", "form.submitted", { reqId });

  const resp = await fetch(
    CONTACT_ENDPOINT, 
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.log("Submission failed:", data.error);
    log("error", "form.submit.failed", { reqId, error: data.error || "unknown" });
    alert(data.error || "Submission failed");
    return;
  }

  alert("Message sent!");
  console.log("Message sent!")
  log("info", "form.submit.success", { reqId, email: maskEmail(payload.email) });
  form.reset();
}

document.getElementById("contact-form").addEventListener("submit", submitContactForm);