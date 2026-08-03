// ============================================================
// ZEBRICKY.JS – sdílené výpočty žebříčků (statistiky + profil)
// Vstup: zapasy[], sazky[] (z hokej27_*), Výstup: hráčské statistiky
// ============================================================

function spocitejStatistiky(zapasy, sazky, fondKorekce = 0, zaplaceneDlouhodobky = 0) {
    const vyhodnocene = zapasy.filter(z => z.status === 'vyhodnoceno');
    const pocetVyhodnocenych = vyhodnocene.length;
    const zapasMap = {};
    zapasy.forEach(z => zapasMap[z.id] = z);

    const hraci = {};
    sazky.forEach(s => {
        if (!hraci[s.user_id]) {
            hraci[s.user_id] = {
                user_id: s.user_id, jmeno: s.jmeno,
                tipu: 0, tipuVyhodnocenych: 0,
                nb: 0, vyhry: 0,
                skore: 0, strelci: 0, trendy: 0,
                historie: []
            };
        }
        const h = hraci[s.user_id];
        h.jmeno = s.jmeno; // nejnovější jméno
        h.tipu++;
        const z = zapasMap[s.zapas_id];
        if (z && z.status === 'vyhodnoceno') {
            h.tipuVyhodnocenych++;
            h.nb += s.nb || 0;
            h.vyhry += Number(s.vyhra_kc || 0);
            if (s.hit_skore) h.skore++;
            if (s.hit_strelec) h.strelci++;
            if (s.hit_trend) h.trendy++;
            h.historie.push({
                zapas: `${z.domaci} vs ${z.hoste}`,
                datum: z.deadline,
                tip: s.skore, strelec: s.strelec,
                vysledek: `${z.vysledek_d}:${z.vysledek_h}`,
                nb: s.nb || 0, vyhra: Number(s.vyhra_kc || 0),
                hit_skore: !!s.hit_skore, hit_strelec: !!s.hit_strelec, hit_trend: !!s.hit_trend
            });
        }
    });

    const list = Object.values(hraci);
    list.forEach(h => {
        h.ucast = pocetVyhodnocenych ? Math.round(h.tipuVyhodnocenych / pocetVyhodnocenych * 100) : 0;
        h.uspSkore = h.tipuVyhodnocenych ? Math.round(h.skore / h.tipuVyhodnocenych * 100) : 0;
        h.uspStrelci = h.tipuVyhodnocenych ? Math.round(h.strelci / h.tipuVyhodnocenych * 100) : 0;
        h.uspTrendy = h.tipuVyhodnocenych ? Math.round(h.trendy / h.tipuVyhodnocenych * 100) : 0;
        h.historie.sort((a, b) => new Date(b.datum) - new Date(a.datum));
    });

    const fond = sazky.length * 5 + Number(zaplaceneDlouhodobky || 0) * 50 + Number(fondKorekce || 0);
    return { hraci: list, fond, pocetVyhodnocenych, celkemSazek: sazky.length };
}

// Seřadí a přiřadí SDÍLENÉ pořadí (1.-2. při shodě hodnoty)
function seradSRankem(list, klic) {
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

// Pozice hráče v žebříčku dle klíče (sdílené pořadí → číslo první pozice)
function poziceHrace(list, klic, userId) {
    const s = seradSRankem(list, klic);
    const h = s.find(x => x.user_id === userId);
    return h ? { rank: h._rank, rankNum: h._rankNum, hodnota: h[klic] } : null;
}

// Titul + hláška dle nejlepšího umístění
function urciTitul(stats, userId) {
    const poz = {
        index: poziceHrace(stats.hraci, 'nb', userId),
        vyhry: poziceHrace(stats.hraci, 'vyhry', userId),
        skore: poziceHrace(stats.hraci, 'skore', userId),
        strelci: poziceHrace(stats.hraci, 'strelci', userId),
        trendy: poziceHrace(stats.hraci, 'trendy', userId)
    };
    const kandidati = [
        { p: poz.index,   titul: 'HVĚZDA NADĚJE',   hlasky: ['Index se před ním třese.', 'Naděje má jméno.', 'Kdo jiný by měl svítit.'] },
        { p: poz.vyhry,   titul: 'BANKOVNÍ LUPIČ',  hlasky: ['Už pro něj jedou těžkooděnci.', 'Trezor nemá šanci.', 'Peníze samy skáčou do kapsy.'] },
        { p: poz.skore,   titul: 'MISTR VÝSLEDKŮ',  hlasky: ['Vidí skóre dřív než rozhodčí.', 'Kalkulačka v hlavě.', 'Prostě to trefí.'] },
        { p: poz.strelci, titul: 'KRÁL STŘELCŮ',    hlasky: ['Ví, komu to tam padá.', 'Střelce cítí na dálku.', 'Kanonýry zná jménem.'] },
        { p: poz.trendy,  titul: 'EXPERT TRENDŮ',   hlasky: ['1-0-2? Hračka.', 'Trend je jeho přítel.', 'Směr zápasu čte jako noviny.'] }
    ].filter(k => k.p);
    kandidati.sort((a, b) => a.p.rankNum - b.p.rankNum);
    const best = kandidati[0];
    if (!best || best.p.rankNum > 3) {
        return { titul: 'NADĚJNÝ SÁZKAŘ', hlaska: 'Jeho chvíle teprve přijde.', pozice: poz };
    }
    const hlaska = best.hlasky[Math.abs(hashCode(userId)) % best.hlasky.length];
    return { titul: best.titul, hlaska, pozice: poz };
}

function hashCode(str) {
    let h = 0;
    for (let i = 0; i < String(str).length; i++) h = ((h << 5) - h + String(str).charCodeAt(i)) | 0;
    return h;
}
