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
        width:58px; height:58px; border-radius:50%; border:none; cursor:pointer;
        background:linear-gradient(135deg, ${b}, ${b}88); color:#05121a;
        font-size:1.4em; box-shadow:0 6px 22px ${b}66;
        display:flex; align-items:center; justify-content:center; font-family:inherit;
    ">💬<span id="chat-badge" style="
        position:absolute; top:-4px; right:-4px; background:#e74c3c; color:#fff;
        font-size:.42em; font-weight:900; min-width:22px; height:22px; border-radius:11px;
        display:none; align-items:center; justify-content:center; padding:0 5px;
    ">0</span></button>

    <div id="chat-panel" style="
        display:none; position:fixed; bottom:88px; right:20px; z-index:901;
        width:340px; max-width:calc(100vw - 40px); height:460px; max-height:70vh;
        background:#0d1420; border:1px solid ${b}55; border-radius:18px;
        box-shadow:0 14px 46px rgba(0,0,0,.6); flex-direction:column; overflow:hidden;
    ">
        <div style="padding:13px 16px; border-bottom:1px solid ${b}33; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:900; color:${b}; font-size:.85em; letter-spacing:1px;">💬 CHAT</span>
            <span onclick="prepniChat()" style="cursor:pointer; opacity:.5; font-size:1.4em; line-height:1;">×</span>
        </div>
        <div id="chat-zpravy" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;"></div>
        <div id="chat-vstup" style="padding:10px; border-top:1px solid ${b}33; display:flex; gap:7px;">
            <input id="chat-text" placeholder="Napiš zprávu…" maxlength="300" onkeydown="if(event.key==='Enter')posliChatZpravu()" style="
                flex:1; background:rgba(255,255,255,.06); color:#fff; border:1px solid ${b}44;
                border-radius:10px; padding:10px 12px; font-size:.85em; font-family:inherit; outline:none;
            ">
            <button onclick="posliChatZpravu()" style="
                background:linear-gradient(135deg, ${b}, ${b}88); color:#05121a; border:none;
                border-radius:10px; padding:0 16px; font-weight:900; cursor:pointer; font-family:inherit;
            ">➤</button>
        </div>
    </div>`;
    document.body.appendChild(el);
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
        const smazat = moje ? `<span onclick="smazChatZpravu(${z.id})" style="cursor:pointer; opacity:.35; margin-left:6px;">🗑</span>` : '';
        return `<div style="align-self:${moje ? 'flex-end' : 'flex-start'}; max-width:82%;">
            <div style="font-size:.62em; opacity:.5; margin-bottom:2px; text-align:${moje ? 'right' : 'left'};">
                ${moje ? 'Ty' : escapeHtml(z.name)} · ${cas}${smazat}
            </div>
            <div style="background:${moje ? _chat.barva + '22' : 'rgba(255,255,255,.06)'};
                        border:1px solid ${moje ? _chat.barva + '55' : 'rgba(255,255,255,.1)'};
                        border-radius:12px; padding:8px 12px; font-size:.85em; word-break:break-word;">
                ${escapeHtml(z.message)}
            </div>
        </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
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
