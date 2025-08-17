// Funkcje do pobierania i przetwarzania plików JSON
async function fetchInstructionsFromUrls(urls) {
    let all = [];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            if (Array.isArray(data)) all = all.concat(data);
            else if (data && typeof data === 'object') all.push(data);
        } catch (e) { /* pomiń błędy */ }
    }
    return all;
}

async function fetchStatsFromUrls(urls) {
    let stats = [];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            stats.push({
                file: url.split('/').pop(),
                count: Array.isArray(data) ? data.length : 0,
                lastUpdate: null // można dodać datę aktualizacji jeśli jest w pliku
            });
        } catch (e) { /* pomiń błędy */ }
    }
    return stats;
}
