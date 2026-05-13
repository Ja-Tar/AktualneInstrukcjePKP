// ==== DARK THEME ====

if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset["theme"] = "dark";
} else {
    document.documentElement.dataset["theme"] = "light";
}

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (ev) => {
        document.documentElement.dataset["theme"] = ev.matches
            ? "dark"
            : "light";
    });

// REMOVE for testing - light theme
document.documentElement.dataset["theme"] = "light";