// ==== DATA TYPES (jsdoc) ====

/**
 * @typedef InstrVersion
 * @property {string} name
 * @property {string} number
 * @property {string} resource_url
 * @property {boolean} wcag
 * @property {string} [found_date]
 * @property {?string} from_date
 * @property {?string} to_date
 */

/**
 * @typedef InstrFile
 * @property {string} number
 * @property {InstrVersion[]} versions
 */

/**
 * @typedef InstrConfig
 * @property {string} fileName
 * @property {InstrFile[]} configInstrFiles
 */

/**
 * @typedef Config
 * @property {Object<string, string>} trackedUrls
 */

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
// TODO: Maybe add settings?
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

// ==== FETCH AND LOAD DATA ====

// TODO: Change to prod url
const webOrigin = "https://rewrite-noai.instrukcje-pkp.pages.dev"; //window.location.origin;

async function fetchData(url) {
    const response = await fetch(url);
    if (response.ok) {
        return await response.json();
    }
    throw new Error(response.statusText);
}

/**
 *
 * @return {Promise<Config | undefined>}
 */
async function getMainConfig() {
    return await fetchData(`${webOrigin}/configs/main.json`);
}

async function getFilesInfo() {
    /**
     * @type {InstrConfig[]}
     */
    const allInstrConfigs = [];

    const mainConfig = await getMainConfig();
    if (!mainConfig) { throw new Error("Could not find main config!"); }
    for (const fileName in mainConfig.trackedUrls) {
        if (Object.hasOwn(mainConfig.trackedUrls, fileName)) {
            const webpageUrl = `${webOrigin}/configs/${fileName}.json`;

            const config = await fetchData(webpageUrl);
            allInstrConfigs.push({
                fileName: fileName,
                configInstrFiles: config
            });
        }
    }

    return {allInstrConfigs, mainConfig};
}

// ==== STATS ====

/**
 * @param allInstrConfigs {InstrConfig[]}
 */
function calculateStatistics(allInstrConfigs) {
    // CURRENTLY COUNTED | UPDATED THIS YEAR | NO LONGER IN USE
    let currentlyCounted = 0;
    let updatedThisYear = 0;
    let noLongerInUse = 0;

    const allInstr = allInstrConfigs.flatMap((config) => {
        return config.configInstrFiles.flatMap((file) => file);
    });

    for (const instr of allInstr) {
        for (let i = 0; i < instr.versions.length; i++) {
            const file = instr.versions[i];

            currentlyCounted++;
            if (i !== 0) {
                noLongerInUse++;
            }

            // TODO: Add found date to main script
            if (file?.found_date || file.from_date !== null) {
                const today = new Date();
                const date = new Date(file?.found_date ?? file.from_date);
                if (today.getFullYear() === date.getFullYear()) {
                    updatedThisYear++;
                }
            }
        }
    }

    return {currentlyCounted, updatedThisYear, noLongerInUse};
}

function loadStatistics(allInstrConfigs) {
    const instSum = document.getElementById("inst-sum");
    const instUpdate = document.getElementById("inst-update");
    const instOld = document.getElementById("inst-old");

    const {currentlyCounted, updatedThisYear, noLongerInUse} = calculateStatistics(allInstrConfigs);
    instSum.textContent = currentlyCounted.toString();
    instUpdate.textContent = updatedThisYear.toString();
    instOld.textContent = noLongerInUse.toString();
}

// ==== LOAD WEBSITE ====

loadSettings();
getFilesInfo().then((configs) => {
    console.log(configs.allInstrConfigs);
    loadStatistics(configs.allInstrConfigs);
});
// TODO: Add autocomplete
// TODO: Add hints
