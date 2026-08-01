/* ============================================================
   SOUPISKY TÝMŮ – MS v hokeji 2027
   PROVIZORNÍ / VYMYŠLENÉ složení (for fun) – před turnajem vyměnit za reálné.

   Formát pro každý tým:
     'NázevTýmu': { G: [brankáři], O: [obránci], U: [útočníci] }
   Názvy týmů musí přesně sedět se SKUPINA_A / SKUPINA_B v index.html.
   Jména jsou příjmení (jak se ukazují ve výběru i ukládají jako střelec).
   ============================================================ */
const SOUPISKY = {
    // ---------- SKUPINA A ----------
    'Německo':   { G: ['Grubauer', 'Niederberger'], O: ['Seider', 'Moritz Müller', 'Gawanke', 'Wagner'], U: ['Draisaitl', 'Stützle', 'Kahun', 'Peterka', 'Michaelis', 'Ehliz'] },
    'Finsko':    { G: ['Säteri', 'Olkinuora'], O: ['Heiskanen', 'Lindbohm', 'Friman', 'Kulmala'], U: ['Aho', 'Granlund', 'Kapanen', 'Armia', 'Puljujärvi', 'Manninen'] },
    'Švédsko':   { G: ['Markström', 'Ersson'], O: ['Hedman', 'Ekholm', 'Karlsson', 'Brodin'], U: ['Pettersson', 'Nylander', 'Zibanejad', 'Lindholm', 'Eriksson', 'Raymond'] },
    'Švýcarsko': { G: ['Genoni', 'Nyffeler'], O: ['Josi', 'Fora', 'Siegenthaler', 'Kukan'], U: ['Meier', 'Hischier', 'Niederreiter', 'Ambühl', 'Fiala', 'Andrighetto'] },
    'Lotyšsko':  { G: ['Merzļikins', 'Kalniņš'], O: ['Balcers', 'Rubīns', 'Cibuļskis', 'Freibergs'], U: ['Girgensons', 'Bātņa', 'Dzierkals', ' Indrašis', 'Marenis', 'Batņa'] },
    'Rakousko':  { G: ['Kickert', 'Madlener'], O: ['Heinrich', 'Strong', 'Unterweger', 'Nickl'], U: ['Rossi', 'Kasper', 'Baltram', 'Thaler', 'Haudum', 'Zündel'] },
    'Slovinsko': { G: ['Gračnar', 'Kristan'], O: ['Gregorc', 'Čepon', 'Pavlin', 'Kuralt'], U: ['Kopitar', 'Urbas', 'Verlič', 'Tomaževič', 'Simšič', 'Jeglič'] },
    'Ukrajina':  { G: ['Karačun', 'Bujnickij'], O: ['Zaharov', 'Simčuk', 'Ljadov', 'Babenko'], U: ['Cimbal', 'Isajenko', 'Zaharčenko', 'Merežko', 'Buculin', 'Naumenko'] },

    // ---------- SKUPINA B ----------
    'Česko':      { G: ['Vejmelka', 'Dostál'], O: ['Krejčí', 'Hronek', 'Ščotka', 'Kundrátek'], U: ['Pastrňák', 'Nečas', 'Červenka', 'Kämpf', 'Zacha', 'Flek'] },
    'Kanada':     { G: ['Montembeault', 'Hill'], O: ['Makar', 'Morrissey', 'Theodore', 'Sanheim'], U: ['McDavid', 'MacKinnon', 'Point', 'Marner', 'Stone', 'Cirelli'] },
    'USA':        { G: ['Swayman', 'Knight'], O: ['Hughes', 'Werenski', 'Fox', 'Sanderson'], U: ['Matthews', 'Eichel', 'Tkachuk', 'Hughes', 'Boldy', 'Farabee'] },
    'Slovensko':  { G: ['Hlavaj', 'Škorvánek'], O: ['Fehérváry', 'Černák', 'Ružička', 'Ivan'], U: ['Slafkovský', 'Tatar', 'Cehlárik', 'Pospíšil', 'Hrivík', 'Takáč'] },
    'Dánsko':     { G: ['Dahm', 'Andersen'], O: ['Lauridsen', 'Jensen', 'Larsen', 'Aagaard'], U: ['Ehlers', 'Bau Hansen', 'Bjorkstrand', 'Aabo', 'Storm', 'True'] },
    'Norsko':     { G: ['Haukeland', 'Holm'], O: ['Holøs', 'Espeland', 'Krogdahl', 'Johannesen'], U: ['Rosseli Olsen', 'Olimb', 'Zuccarello', 'Reichenberg', 'Martinsen', 'Kaasastul'] },
    'Kazachstán': { G: ['Šutov', 'Nikitin'], O: ['Blacker', 'Metalnikov', 'Dietz', 'Loginov'], U: ['Michajlis', 'Panjukov', 'Šesťorkin', 'Savickij', 'Rymarev', 'Starčenko'] },
    'Maďarsko':   { G: ['Vay', 'Bálizs'], O: ['Stipsicz', 'Szabó', 'Kiss', 'Hadobás'], U: ['Sofron', 'Galló', 'Nagy', 'Terbócs', 'Bartalis', 'Vincze'] },
};

// Pomocná: vrátí soupisku týmu, nebo prázdnou strukturu
function soupiskaTymu(nazev) {
    return SOUPISKY[nazev] || { G: [], O: [], U: [] };
}
