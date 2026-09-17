(() => {
  const API_URL = "https://avani-ai-q7mq.onrender.com";
  const button = document.getElementById("saveProfile");
  const modal = document.getElementById("authModal");
  if (!button || !modal) return;

  const note = document.createElement("label");
  note.className = "privacy consent-row";
  note.style.cssText = "display:flex;gap:8px;align-items:flex-start;text-align:left;margin:12px 0;line-height:1.35;";
  note.innerHTML = '<input id="signupConsent" type="checkbox" style="margin-top:3px"> <span>I agree that the name/email I provide may be recorded in Avani AI\'s private signup sheet for account management and service administration.</span>';
  button.parentElement.insertBefore(note, button);

  button.addEventListener("click", async (event) => {
    const existing = localStorage.getItem("avaniUserProfile");
    if (!existing && !document.getElementById("signupConsent")?.checked) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof window.toast === "function") window.toast("Please confirm the signup-data notice first.");
      else alert("Please confirm the signup-data notice first.");
      return;
    }

    if (existing) return;

    setTimeout(async () => {
      try {
        const profile = JSON.parse(localStorage.getItem("avaniUserProfile") || "null");
        if (!profile) return;
        const response = await fetch(`${API_URL}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profile.name || "",
            email: profile.email || "",
            uid: "",
            provider: "local-profile",
          }),
        });
        if (!response.ok) console.warn("Avani signup tracking failed", await response.text());
      } catch (error) {
        console.warn("Avani signup tracking unavailable", error);
      }
    }, 250);
  }, true);
})();
