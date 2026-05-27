// ==== DARK THEME ====
const themeButton = document.getElementById("theme-switch")

if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset["theme"] = "dark";
    themeButton.checked = true;
} else {
    document.documentElement.dataset["theme"] = "light";
    themeButton.checked = false;
}

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (ev) => {
        document.documentElement.dataset["theme"] = ev.matches
            ? "dark"
            : "light";
    });

themeButton.addEventListener("change", toggleTheme);

function toggleTheme() {
    if (document.documentElement.dataset["theme"] === "light") {
        document.documentElement.dataset["theme"] = "dark";
    } else {
        document.documentElement.dataset["theme"] = "light";
    }
}