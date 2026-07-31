// ============================================================
// CL-ZEBRICKY.JS – sdílené výpočty žebříčků pro Champions League
// Vstup: zapasy[] (cl_zapasy), tipy[] (cl_tipy_zapasy), dlouhodobe[] (cl_dlouhodobe)
// Výstup: hráčské statistiky po kategoriích
// ============================================================

function spocitejStatistikyCL(zapasy, tipy, dlouhodobe) {
    const vyhodnocene = zapasy.filter(z => z.status === 'vyhodnoceno');
    const pocetVyhodnocenych = vyhodnocene.length;
    const zapasMap = {};
    zapasy.forEach(z => zapasMap[z.id] = z);

    const hraci = {};
    function zajistiHrace(user_id, jmeno) {
        if (!hraci[user_id]) {
            hraci[user_id] = {
                user_id, jmeno,
                tipu: 0, tipuVyhodnocenych: 0,
                zapasBody: 0,        // body ze zápasových tipů
                skore: 0, trendy: 0, // počet trefených přesných skóre / trendů
                dlBody: 0,           // body z dlouhodobek (body1 + body2)
                celkem: 0
            };
        }
        if (jmeno) hraci[user_id].jmeno = jmeno; // nejnovější jméno
        return hraci[user_id];
    }

    // Zápasové tipy
    tipy.forEach(t => {
        const h = zajistiHrace(t.user_id, t.jmeno);
        h.tipu++;
        const z = zapasMap[t.zapas_id];
        if (z && z.status === 'vyhodnoceno') {
            h.tipuVyhodnocenych++;
            h.zapasBody += t.body || 0;
            if (t.hit_skore) h.skore++;
            if (t.hit_trend) h.trendy++;
        }
    });

    // Dlouhodobky (základní část + cesta k titulu)
    dlouhodobe.forEach(d => {
        const h = zajistiHrace(d.user_id, d.jmeno);
        h.dlBody += (d.body1 || 0) + (d.body2 || 0);
    });

    const list = Object.values(hraci);
    list.forEach(h => {
        h.celkem = h.zapasBody + h.dlBody;
        h.ucast = pocetVyhodnocenych ? Math.round(h.tipuVyhodnocenych / pocetVyhodnocenych * 100) : 0;
        h.uspSkore = h.tipuVyhodnocenych ? Math.round(h.skore / h.tipuVyhodnocenych * 100) : 0;
        h.uspTrendy = h.tipuVyhodnocenych ? Math.round(h.trendy / h.tipuVyhodnocenych * 100) : 0;
    });

    return { hraci: list, pocetVyhodnocenych };
}

// Seřadí a přiřadí SDÍLENÉ pořadí (1.-2. při shodě hodnoty)
function seradSRankemCL(list, klic) {
    const sorted = [...list].sort((a, b) => b[klic] - a[klic]);
    let i = 0;
    while (i < sorted.length) {
        let j = i;
        while (j + 1 < sorted.length && sorted[j + 1][klic] === sorted[i][klic]) j++;
        const label = i === j ? `${i + 1}.` : `${i + 1}.-${j + 1}.`;
        for (let k = i; k <= j; k++) { sorted[k]._rank = label; sorted[k]._rankNum = i + 1; }
        i = j + 1;
    }
    return sorted;
}
