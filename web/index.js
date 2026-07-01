/*jshint loopfunc: true */
// ==== DATA TYPES (jsdoc) ====

import {orderBy} from "./modules/natural-orderby.production.min.js";

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
 * @property {string} fileName
 * @property {InstrVersion[]} versions
 */

/**
 * @typedef InstrConfig
 * @property {string} url
 * @property {string} fileName
 * @property {string} categoryName
 * @property {string} instrNrStartsWith
 */

/**
 * @typedef Config
 * @property {InstrConfig[]} trackedUrls
 */

/**
 * @typedef AllConfigs
 * @property {InstrFile[]} allInstrFiles
 * @property {InstrConfig[]} mainConfig
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

/**
 * @param url {string}
 * @return {Promise<any>}
 */
async function fetchData(url) {
    const response = await fetch(url);
    if (response.ok) {
        return await response.json();
    }
    throw new Error(response.statusText);
}

/**
 * @return {Promise<Config | undefined>}
 */
async function getMainConfig() {
    return await fetchData(`${webOrigin}/configs/main.json`);
}

/**
 * @return {Promise<AllConfigs>}
 */
async function getFilesInfo() {
    /**
     * @type {InstrFile[]}
     */
    const allInstrFiles = [];

    const mainConfig = await getMainConfig();
    if (!mainConfig) { throw new Error("Could not find main config!"); }
    for (const remoteFile of mainConfig.trackedUrls) {
        const webpageUrl = `${webOrigin}/configs/${remoteFile.fileName}.json`;

        /** @type {{number: string, versions:InstrVersion[]}[]} */
        const config = await fetchData(webpageUrl);
        config.forEach((instr) => {
            allInstrFiles.push({number:instr.number, versions:instr.versions, fileName:remoteFile.fileName});
        });
    }

    return {allInstrFiles, mainConfig};
}

// ==== STATS ====

/**
 * @param allInstrFiles {InstrFile[]}
 */
function calculateStatistics(allInstrFiles) {
    // CURRENTLY COUNTED | UPDATED THIS YEAR | NO LONGER IN USE
    let currentlyCounted = 0;
    let updatedThisYear = 0;
    let noLongerInUse = 0;

    for (const instr of allInstrFiles) {
        //console.debug(instr);
        for (let i = 0; i < instr.versions.length; i++) {
            const file = instr.versions[i];

            currentlyCounted++;
            if (i !== 0) {
                const previousFile = instr.versions.at(i-1);
                if (previousFile.wcag !== file.wcag) {
                    if (file.from_date && previousFile.from_date === file.from_date) {
                        //console.debug(`SKIP [from date] -> index [${i}]`);
                        continue;
                    } else if (file.to_date && previousFile.to_date === file.to_date) {
                        //console.debug(`SKIP [to date] -> index [${i}]`);
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

/**
 * @param allInstrFiles {InstrFile[]}
 */
function loadStatistics(allInstrFiles) {
    const instSum = document.getElementById("inst-sum");
    const instUpdate = document.getElementById("inst-update");
    const instOld = document.getElementById("inst-old");

    const {currentlyCounted, updatedThisYear, noLongerInUse} = calculateStatistics(allInstrFiles);
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
 * @param instrConfigs {InstrFile[]}
 * @returns {InstrWordNumber[]}
 */
function setupWordSearch(instrConfigs) {
    const instrNameNumber = instrConfigs.flatMap(instrConfig => {
        return {name: instrConfig.versions[0].name, number: instrConfig.number};
    });
    /**
     * @type {InstrWordNumber[]}
     */
    const instrWordNumber = [];
    instrNameNumber.forEach(object => {
        const filteredName = object.name.replaceAll(/[(),]| -/g, "");
        const splitName = filteredName.split(/[ \/]/);
        splitName.forEach((item) => {
            instrWordNumber.push({word: item.toLowerCase(), number: object.number});
        });
    });
    return instrWordNumber.sort((a, b) => {
        return a.word.localeCompare(b.word);
    });
}

const customAutocomplete = document.getElementById("custom-autocomplete");

/**
 * @param instrFile {InstrFile}
 */
function addAutocompleteElement(instrFile) {
    // TODO Highlight searched value
    const autocompleteElement = document.createElement("a");
    autocompleteElement.classList.add("autocomplete");
    autocompleteElement.href = "#";

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

/**
 * @typedef InstrWordNumber
 * @property {string} word
 * @property {string} number
 */

/**
 * @param inputEvent {InputEvent}
 * @param configs {AllConfigs}
 * @param sortedWordNumber {InstrWordNumber[]}
 */
function runAutocomplete(inputEvent, configs, sortedWordNumber) {
    if (!inputEvent.currentTarget.value || inputEvent.currentTarget.value.length < 2) {
        customAutocomplete.classList.add("hidden");
        return;
    }
    customAutocomplete.textContent = "";
    if (edgeCasesNumberAutocomplete(inputEvent)) {
        numberAutocomplete(inputEvent.currentTarget.value, configs.allInstrFiles).forEach((item) => {
            addAutocompleteElement(item);
        });
    } else {
        wordAutocomplete(inputEvent.currentTarget.value.toLowerCase(), sortedWordNumber).forEach((/**InstrWordNumber*/wordNumber) => {
            addAutocompleteElement(configs.allInstrFiles.find((instr) => instr.number === wordNumber.number));
        });
    }
    customAutocomplete.classList.remove("hidden");
    // TODO Make categories to use with word search
}

/**
 * @param inputEvent {InputEvent}
 */
function edgeCasesNumberAutocomplete(inputEvent) {
    let value = inputEvent.currentTarget.value;
    const regexNumber = /^[Ii][a-z][ -]\w+(?:\.\d+| .+|)$/gm;
    if (regexNumber.test(value)) {
        if (value.startsWith("i")) {
            value = "I" + value.slice(1);
        }
        if (value.at(2) === " ") {
            value = value.slice(0, 2) + "-" + value.slice(3);
        }
        inputEvent.currentTarget.value = value;
        return true;
    }
    return false;
}

/**
 * Binary search for custom properties
 * @param value {string}
 * @param sortedObjects {Object[]}
 * @param searchedProperty {string}
 * @return {Object[]}
 */
function searchAlgorithm(value, sortedObjects, searchedProperty) {
    const matchIndex = findIndex(value);
    if (matchIndex === -1) {return [];}
    const matches = [sortedObjects[matchIndex]];
    return matches.concat(farmMatches(value, matchIndex));

    /**
     * @param query {string}
     * @param start {number}
     * @param end {number}
     * @return {number}
     */
    function findIndex(query, start = 0, end = sortedObjects.length) {
        if (start > end) {return -1;}
        const midpoint = Math.floor(start + ((end - start) / 2));
        /** @type {string} */
        const string = sortedObjects[midpoint][searchedProperty];
        if (string.startsWith(query)) {return midpoint;}
        [start, end] = query.localeCompare(sortedObjects[midpoint][searchedProperty]) < 0 ? [start, midpoint - 1] : [midpoint + 1, end];
        return findIndex(query, start, end);
    }

    /**
     * @param value {string}
     * @param matchIndex {number}
     * @returns {Object[]}
     */
    function farmMatches(value, matchIndex) {
        /** @type {Object[]} */
        const matches = [];

        for (let i = matchIndex + 1; i < sortedObjects.length; i++) {
            if (!sortedObjects[i][searchedProperty].startsWith(value)) {break;}
            matches.push(sortedObjects[i]);
        }

        for (let j = matchIndex - 1; j >= 0; j--) {
            if (!sortedObjects[j][searchedProperty].startsWith(value)) {break;}
            matches.push(sortedObjects[j]);
        }

        return matches;
    }
}

/**
 * @param value {string}
 * @param instrFiles {InstrFile[]}
 * @return {InstrFile[]}
 */
function numberAutocomplete(value, instrFiles) {
    const sortedInstrFiles = instrFiles.sort((a, b) => {
       return a.number.localeCompare(b.number);
    });
    const selectedInstr = searchAlgorithm(value, sortedInstrFiles, "number");
    return orderBy(
        selectedInstr,
        [v => v.number],
        "asc"
    );
}

/**
 * @param value {string}
 * @param sortedWordNumber {InstrWordNumber[]}
 */
function wordAutocomplete(value, sortedWordNumber) {
    const splitValue = value.split(" ");
    /** @type {InstrWordNumber[]} */
    let results = searchAlgorithm(splitValue[0], sortedWordNumber, "word");
    if (splitValue.length > 1) {
        const remainingWords = splitValue.slice(1);
        const resultsInstrNumbers = results.flatMap(wordNum => wordNum.number);
        const remainingWordNumber = sortedWordNumber.filter((wordNum) =>
            resultsInstrNumbers.includes(wordNum.number));
        remainingWords.forEach((word) => {
            if (!word) {return;}
            results = searchAlgorithm(word, remainingWordNumber, "word");
        });
    }
    return orderBy(
        results,
        [v => v.number],
        "asc"
    );
    // TODO: Make it so Ir instructions are on top
}

// === INSTRUCTION DETAILS ===

function openInstr(number) {
    console.log(number);
}

// ==== LOAD WEBSITE ====

loadSettings();
getFilesInfo().then(async (configs) => {
    //console.log(configs.allInstrFiles);
    loadStatistics(configs.allInstrFiles);
    if (!searchField.matches(':focus')) {
        runHints();
    }
    searchField.addEventListener("input",
        ( inputEvent) => runAutocomplete(
            /** @type {InputEvent} */ inputEvent,
            configs,
            setupWordSearch(configs.allInstrFiles)
        )
    );
});
