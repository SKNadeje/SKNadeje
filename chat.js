/* ============================================================
   CHAT.JS – univerzální chat modul pro soutěžní appky
   
   Použití (v HTML za načtením Supabase klienta):
     <script src="../chat.js"></script>
     <script>
       inicializujChat({
         klient: sb,                  // instance Supabase klienta
         tabulka: 'hokej27_chat',     // tabulka se zprávami
         soutez: 'hokej',             // klíč pro notifikace
         barva: '#00f2ff'             // hlavní barva appky
       });
     </script>
   ============================================================ */

let _chat = {
    klient: null, tabulka: null, soutez: null, barva: '#00f2ff',
    otevreno: false, neprectene: 0, zpravy: [], subscription: null,
    mojeId: null, mojeJmeno: null, poslednioOdeslani: 0
};

function inicializujChat(config) {
    Object.assign(_chat, config);
    vlozChatHTML();
    zjistiUzivatele();
    nactiZpravy();
    nastavRealtime();
}

async function zjistiUzivatele() {
    const { data: { session } } = await _chat.klient.auth.getSession();
    if (!session?.user) return;
    _chat.mojeId = session.user.id;
    const { data: h } = await _chat.klient.from('hraci').select('jmeno').eq('user_id', _chat.mojeId).maybeSingle();
    _chat.mojeJmeno = h?.jmeno || session.user.email.split('@')[0];
}

function vlozChatHTML() {
    const b = _chat.barva;
    const el = document.createElement('div');
    el.innerHTML = `
    <button id="chat-fab" onclick="prepniChat()" style="
        position:fixed; bottom:20px; right:20px; z-index:900;
        width:60px; height:60px; border-radius:50%; cursor:pointer;
        background:var(--neon, ${b}); color:#05121a;
        border:2px solid rgba(255,255,255,.85);
        font-size:1.5em; box-shadow:0 6px 26px rgba(0,0,0,.45), 0 0 22px ${b}88;
        display:flex; align-items:center; justify-content:center; font-family:inherit;
        transition:transform .2s ease;
    " onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">💬<span id="chat-badge" style="
        position:absolute; top:-4px; right:-4px; background:#e74c3c; color:#fff;
        font-size:.42em; font-weight:900; min-width:22px; height:22px; border-radius:11px;
        display:none; align-items:center; justify-content:center; padding:0 5px; border:2px solid #fff;
    ">0</span></button>

    <div id="chat-panel" style="
        display:none; position:fixed; bottom:88px; right:20px; z-index:901;
        width:340px; max-width:calc(100vw - 40px); height:460px; max-height:70vh;
        background:#0d1420; border:1px solid ${b}55; border-radius:18px; color:#eef2f7;
        box-shadow:0 14px 46px rgba(0,0,0,.6); flex-direction:column; overflow:hidden;
    ">
        <div style="padding:13px 16px; border-bottom:1px solid ${b}33; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:900; color:${b}; font-size:.85em; letter-spacing:1px;">💬 CHAT</span>
            <span onclick="prepniChat()" style="cursor:pointer; opacity:.5; font-size:1.4em; line-height:1;">×</span>
        </div>
        <div id="chat-zpravy" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;"></div>
        <div id="chat-emoji-paleta" style="display:none; padding:8px 10px; border-top:1px solid ${b}33; flex-wrap:wrap; gap:4px; max-height:120px; overflow-y:auto;"></div>
        <div id="chat-vstup" style="padding:10px; border-top:1px solid ${b}33; display:flex; gap:7px; align-items:center;">
            <button onclick="prepniEmoji()" style="
                background:rgba(255,255,255,.06); border:1px solid ${b}44; color:#fff;
                border-radius:10px; padding:0 10px; height:38px; cursor:pointer; font-size:1.1em; font-family:inherit;
            ">😊</button>
            <input id="chat-text" placeholder="Napiš zprávu…" maxlength="300" onkeydown="if(event.key==='Enter')posliChatZpravu()" style="
                flex:1; background:rgba(255,255,255,.06); color:#fff; border:1px solid ${b}44;
                border-radius:10px; padding:10px 12px; font-size:.85em; font-family:inherit; outline:none;
            ">
            <button id="chat-send-btn" onclick="posliChatZpravu()" style="
                background:var(--neon, ${b}); color:#fff; border:2px solid rgba(255,255,255,.85);
                border-radius:12px; padding:0 18px; height:42px; font-weight:900; font-size:1.2em; cursor:pointer; font-family:inherit;
                box-shadow:0 2px 10px rgba(0,0,0,.35); flex-shrink:0;
            ">➤</button>
        </div>
    </div>`;
    document.body.appendChild(el);
}

// Paleta nejběžnějších emoji
const CHAT_EMOJI = ['😀','😂','🤣','😊','😍','😎','🤔','😉','😢','😭','😡','👍','👎','👏','🙌','🔥','⚽','🏆','🎯','💪','🤝','🎉','❤️','💔','😴','🤯','🥳','😱','🙏','💯'];

function prepniEmoji() {
    const p = document.getElementById('chat-emoji-paleta');
    if (!p) return;
    const zobrazit = p.style.display === 'none';
    if (zobrazit && !p.dataset.napln) {
        p.innerHTML = CHAT_EMOJI.map(e =>
            `<span onclick="vlozEmoji('${e}')" style="cursor:pointer; font-size:1.3em; padding:3px 5px; border-radius:6px;">${e}</span>`
        ).join('');
        p.dataset.napln = '1';
    }
    p.style.display = zobrazit ? 'flex' : 'none';
}

function vlozEmoji(e) {
    const input = document.getElementById('chat-text');
    if (!input) return;
    input.value += e;
    input.focus();
}

function prepniChat() {
    _chat.otevreno = !_chat.otevreno;
    const p = document.getElementById('chat-panel');
    p.style.display = _chat.otevreno ? 'flex' : 'none';
    if (_chat.otevreno) {
        _chat.neprectene = 0;
        obnovBadge();
        vykresliZpravy();
        setTimeout(() => {
            const box = document.getElementById('chat-zpravy');
            if (box) box.scrollTop = box.scrollHeight;
        }, 50);
    }
}

function obnovBadge() {
    const b = document.getElementById('chat-badge');
    if (!b) return;
    b.textContent = _chat.neprectene;
    b.style.display = _chat.neprectene > 0 ? 'flex' : 'none';
}

async function nactiZpravy() {
    try {
        const { data } = await _chat.klient
            .from(_chat.tabulka).select('*')
            .order('created_at', { ascending: false }).limit(50);
        _chat.zpravy = (data || []).reverse();
        vykresliZpravy();
    } catch (e) { console.warn('Chat: načtení selhalo', e); }
}

function vykresliZpravy() {
    const box = document.getElementById('chat-zpravy');
    if (!box) return;
    if (!_chat.zpravy.length) {
        box.innerHTML = '<div style="text-align:center; opacity:.4; font-size:.8em; padding:20px;">Zatím žádné zprávy.<br>Buď první! 👋</div>';
        return;
    }
    box.innerHTML = _chat.zpravy.map(z => {
        const moje = z.user_id === _chat.mojeId;
        const cas = new Date(z.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        const upraveno = z.edited_at ? ` <span style="opacity:.5;">(upraveno)</span>` : '';
        const akce = moje
            ? `<span onclick="upravChatZpravu(${z.id})" style="cursor:pointer; opacity:.35; margin-left:6px;">✏️</span><span onclick="smazChatZpravu(${z.id})" style="cursor:pointer; opacity:.35; margin-left:4px;">🗑</span>`
            : '';
        return `<div style="align-self:${moje ? 'flex-end' : 'flex-start'}; max-width:82%;">
            <div style="font-size:.62em; opacity:.5; margin-bottom:2px; text-align:${moje ? 'right' : 'left'};">
                ${moje ? 'Ty' : escapeHtml(z.name)} · ${cas}${akce}
            </div>
            <div style="background:${moje ? _chat.barva + '22' : 'rgba(255,255,255,.06)'};
                        border:1px solid ${moje ? _chat.barva + '55' : 'rgba(255,255,255,.1)'};
                        border-radius:12px; padding:8px 12px; font-size:.85em; word-break:break-word;">
                ${formatujText(z.message)}${upraveno}
            </div>
        </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

// Escapuje HTML a zvýrazní @zmínky hráčů
function formatujText(s) {
    const safe = escapeHtml(s);
    // @Jméno nebo @Jméno Příjmení (písmena, číslice, tečka, podtržítko; i s jednou mezerou uvnitr)
    return safe.replace(/@([\p{L}0-9_.]+(?:\s[\p{L}0-9_.]+)?)/gu,
        `<span style="color:${_chat.barva}; font-weight:700;">@$1</span>`);
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = String(s ?? '');
    return d.innerHTML;
}

async function posliChatZpravu() {
    const input = document.getElementById('chat-text');
    const text = input.value.trim();
    if (!text) return;

    if (!_chat.mojeId) { alert('Pro psaní do chatu se musíš přihlásit.'); return; }

    // Režim úpravy existující zprávy
    if (_chat.upravovanaId) {
        const id = _chat.upravovanaId;
        try {
            const { error } = await _chat.klient.from(_chat.tabulka)
                .update({ message: text, edited_at: new Date().toISOString() })
                .eq('id', id).eq('user_id', _chat.mojeId);
            if (error) throw error;
            const z = _chat.zpravy.find(x => x.id === id);
            if (z) { z.message = text; z.edited_at = new Date().toISOString(); }
            zrusUpravu();
            vykresliZpravy();
        } catch (e) {
            alert('Úpravu se nepodařilo uložit: ' + e.message);
        }
        return;
    }

    if (Date.now() - _chat.poslednioOdeslani < 3000) { alert('Počkej chvilku, píšeš moc rychle 😅'); return; }

    input.value = '';
    _chat.poslednioOdeslani = Date.now();

    try {
        const { error } = await _chat.klient.from(_chat.tabulka).insert({
            user_id: _chat.mojeId, name: _chat.mojeJmeno, message: text
        });
        if (error) throw error;
        posliChatNotifikaci(text);
    } catch (e) {
        alert('Zprávu se nepodařilo odeslat: ' + e.message);
        input.value = text;
    }
}

// Zahájí úpravu vlastní zprávy – načte ji do inputu
function upravChatZpravu(id) {
    const z = _chat.zpravy.find(x => x.id === id);
    if (!z || z.user_id !== _chat.mojeId) return;
    _chat.upravovanaId = id;
    const input = document.getElementById('chat-text');
    input.value = z.message;
    input.focus();
    const btn = document.getElementById('chat-send-btn');
    if (btn) btn.textContent = '✓';
    let lista = document.getElementById('chat-edit-info');
    if (!lista) {
        lista = document.createElement('div');
        lista.id = 'chat-edit-info';
        lista.style.cssText = 'font-size:.62em; padding:4px 12px; opacity:.7; display:flex; justify-content:space-between; align-items:center;';
        const vstup = document.getElementById('chat-vstup');
        vstup.parentNode.insertBefore(lista, vstup);
    }
    lista.innerHTML = `<span>✏️ Upravuješ zprávu</span><span onclick="zrusUpravu()" style="cursor:pointer; text-decoration:underline;">zrušit</span>`;
}

// Zruší režim úpravy
function zrusUpravu() {
    _chat.upravovanaId = null;
    const input = document.getElementById('chat-text');
    if (input) input.value = '';
    const btn = document.getElementById('chat-send-btn');
    if (btn) btn.textContent = '➤';
    const lista = document.getElementById('chat-edit-info');
    if (lista) lista.remove();
}

async function smazChatZpravu(id) {
    if (!confirm('Smazat zprávu?')) return;
    await _chat.klient.from(_chat.tabulka).delete().eq('id', id);
    _chat.zpravy = _chat.zpravy.filter(z => z.id !== id);
    vykresliZpravy();
}

// Push ostatním (ne sobě) – přes edge funkci chat-notifikace
async function posliChatNotifikaci(text) {
    try {
        await fetch('https://vlabocwezmpwnxrwxihs.supabase.co/functions/v1/chat-notifikace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (window.SB_KEY || '')
            },
            body: JSON.stringify({
                soutez: _chat.soutez,
                jmeno: _chat.mojeJmeno,
                zprava: text.slice(0, 120),
                odesilatel_id: _chat.mojeId
            })
        });
    } catch (e) { console.warn('Chat notifikace selhala:', e); }
}

function nastavRealtime() {
    if (_chat.subscription) return;
    _chat.subscription = _chat.klient
        .channel('chat-' + _chat.tabulka)
        .on('postgres_changes', { event: '*', schema: 'public', table: _chat.tabulka }, (payload) => {
            if (payload.eventType === 'INSERT') {
                _chat.zpravy.push(payload.new);
                if (_chat.zpravy.length > 50) _chat.zpravy.shift();
                if (!_chat.otevreno && payload.new.user_id !== _chat.mojeId) {
                    _chat.neprectene++;
                    obnovBadge();
                }
            } else if (payload.eventType === 'DELETE') {
                _chat.zpravy = _chat.zpravy.filter(z => z.id !== payload.old.id);
            }
            if (_chat.otevreno) vykresliZpravy();
        })
        .subscribe();
}
