/*jshint loopfunc: true */
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
        console.debug(instr);
        for (let i = 0; i < instr.versions.length; i++) {
            const file = instr.versions[i];

            currentlyCounted++;
            if (i !== 0) {
                const previousFile = instr.versions.at(i-1);
                if (previousFile.wcag !== file.wcag) {
                    if (file.from_date && previousFile.from_date === file.from_date) {
                        console.debug(`SKIP [from date] -> index [${i}]`);
                        continue;
                    } else if (file.to_date && previousFile.to_date === file.to_date) {
                        console.debug(`SKIP [to date] -> index [${i}]`);
                        continue;
                    }
                }
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

// ==== TYPING HINTS ====

const hints = [
    "Ir-1",
    "sygnalizacji",
    "ładunków",
    "Ie-1"
];

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

const typingHintsElement = document.getElementById("typing-hint");
const typingHintsAfterElement = document.getElementById("typing-hint-indicator");

async function wait(time){
    await new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

async function randomWait(min, max) {
    await wait(getRandomArbitrary(min, max));
}

async function writeHint(hintString, hintsIntervalId=0, firstId=0) {
    typingHintsAfterElement.classList.add("stopped");
    typingHintsElement.textContent = "";
    for (let i = 0; i < hintString.length; i++) {
        await randomWait(150, 300);
        if (hintsIntervalId !== firstId) {break;}
        typingHintsElement.innerHTML += hintString.charAt(i);
    }
    await wait(500);
    typingHintsAfterElement.classList.remove("stopped");
}

async function deleteHint(hintsIntervalId=0, firstId=0) {
    typingHintsAfterElement.classList.add("stopped");
    await wait(500);
    for (let i = typingHintsElement.textContent.length; i >= 0; i--) {
        await randomWait(50, 150);
        if (hintsIntervalId !== firstId) {break;}
        typingHintsElement.textContent = typingHintsElement.innerHTML.substring(0, i);
    }
    typingHintsAfterElement.classList.remove("stopped");
}

const typingHintBox = document.getElementById("typing-hint-box");
let hintsIntervalId = 0;

async function runHints() {
    if (hintsIntervalId) {return;}
    typingHintBox.classList.remove("hidden");
    hintsIntervalId = Math.floor(Math.random() * 10000);
    const firstId = hintsIntervalId;
    //console.log(`${firstId} - ${hintsIntervalId}`);
    while (hintsIntervalId === firstId) {
        for (const hint of hints) {
            if (Math.random() > 0.5) {continue;}
            await wait(1000);
            if (hintsIntervalId !== firstId) {return;}
            await writeHint(hint, hintsIntervalId, firstId);
            if (hintsIntervalId !== firstId) {return;}
            await wait(2000);
            if (hintsIntervalId !== firstId) {return;}
            await deleteHint(hintsIntervalId, firstId);
            if (hintsIntervalId !== firstId) {return;}
        }
    }
}


function stopHints() {
    hintsIntervalId = 0;
    typingHintBox.classList.add("hidden");
}

const searchField = document.getElementById("search");

searchField.addEventListener("focusin", stopHints);
searchField.addEventListener("focusout", () => {
    if (searchField.value === "") {
        runHints();
    }
});

// ==== AUTOCOMPLETE ====

/**
 * @param allInstrConfigs {InstrConfig[]}
 * @return {string[]}
 */
function getOnlyInstrNumbers(allInstrConfigs) {
    return allInstrConfigs.flatMap(instrConfig => {
        return instrConfig.configInstrFiles.flatMap(instrFile => {
            return instrFile.number;
        });
    });
}

/**
 * @param inputEvent {InputEvent}
 * @param allInstrConfigs {InstrConfig[]}
 * @param allInstrNumbers {string[]}
 */
function runAutocomplete(inputEvent, allInstrConfigs, allInstrNumbers) {
    /** @type {string} */
    const value = inputEvent.currentTarget.value;
    if (!value) {return;}
    if (value.startsWith("I")) {
        numberAutocomplete(value, allInstrNumbers);
    }
}

/**
 * @param value {string}
 * @param strings {string[]}
 */
function numberAutocomplete(value, strings) {
    console.log(value, strings);
}

const customAutocomplete = document.getElementById("custom-autocomplete");

/**
 * @param instrFile {InstrFile}
 */
function addAutocompleteElement(instrFile) {
    const autocompleteElement = document.createElement("div");
    autocompleteElement.classList.add("autocomplete");

    const idElement = document.createElement("div");
    idElement.classList.add("in-autocomplete", "id");
    idElement.textContent = instrFile.number;

    const fullNameElement = document.createElement("div");
    fullNameElement.classList.add("in-autocomplete", "full-name");
    fullNameElement.textContent = instrFile.versions[0].name;

    autocompleteElement.appendChild(idElement);
    autocompleteElement.appendChild(fullNameElement);
    customAutocomplete.appendChild(autocompleteElement);
}

// ==== LOAD WEBSITE ====

loadSettings();
getFilesInfo().then(async (configs) => {
    console.log(configs.allInstrConfigs);
    loadStatistics(configs.allInstrConfigs);
    if (!searchField.matches(':focus')) {
        runHints();
    }
    // const allInstr = configs.allInstrConfigs.flatMap((config) => {
    //     return config.configInstrFiles.flatMap((file) => file);
    // });
    // allInstr.forEach((file) => {
    //     addAutocompleteElement(file);
    // });
    searchField.addEventListener("input",
        ( inputEvent) => runAutocomplete(
            /** @type {InputEvent} */ inputEvent,
            configs.allInstrConfigs,
            getOnlyInstrNumbers(configs.allInstrConfigs),
        )
    );
});
// TODO: Add autocomplete
