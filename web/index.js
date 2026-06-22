
// ==== DARK THEME ====
const themeButton = document.getElementById("theme-button");
if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    toggleTheme("dark");
} else {
    toggleTheme("light");
}

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (ev) => {
        toggleTheme(ev.matches ? "dark" : "light");
    });

// ==== SETTINGS ====
function toggleSettings() {
    const settingsBox = document.getElementById("settings-box");
    settingsBox.classList.toggle("hide");
}

// -- Settings saving --

const savedSettings = [
    toggleTheme,
];

/**
 * @param fun {function}
 */
function saveSetting(fun) {
    const funName = fun.name;
    const funValue = fun();
    if (funName && savedSettings.includes(fun) && funValue) {
        localStorage.setItem(funName, funValue);
    }
}

function loadSettings() {
    for (const fun of savedSettings) {
        const savedData = localStorage.getItem(fun.name);
        if (savedData) {
            fun(savedData);
        }
    }
}

// -- Settings functions --

/**
 * @param [savedSetting] {string}
 */
function toggleTheme(savedSetting) {
    const documentDataset = document.documentElement.dataset;
    let theme = documentDataset.theme === "light" ? "dark" : "light";
    if (savedSetting) {
        theme = savedSetting;
    }

    themeButton.checked = (theme === "dark");
    documentDataset.theme = theme;
    return theme;
}

themeButton.addEventListener("change", () => {
    saveSetting(toggleTheme);
});

// ==== LOAD WEBSITE ====

loadSettings();
// TODO: Add autocomplete
// TODO: Add hints
// TODO: Add stats
