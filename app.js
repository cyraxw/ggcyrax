// CYRAX//GG — Supabase-backed CODM community database
// 1) Create a Supabase project, run supabase.sql in SQL Editor.
// 2) Paste Project URL and anon key below. Never put service_role key in browser code.
const SUPABASE_URL = "https://nvnnnnlkpfffdtvtndsi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tGkyUcp7pM6yao8q78-acw_tbTvNgLr";

const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null,
    records = [];
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));

function toast(msg) {
    $("toast").textContent = msg;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2600)
}

function copy(text) {
    navigator.clipboard.writeText(text).then(() => toast("COPIED TO CLIPBOARD")).catch(() => toast("Clipboard unavailable — select and copy manually"))
}
$("year").textContent = new Date().getFullYear();
$("adminOpen").onclick = () => $("adminModal").classList.add("open");
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $("adminModal").classList.remove("open"));
$("adminModal").addEventListener("click", e => {
    if (e.target === $("adminModal")) $("adminModal").classList.remove("open")
});
$("menuBtn").onclick = () => document.querySelector("nav").classList.toggle("show");
$("submitBuild").onclick = () => {
    $("adminModal").classList.add("open");
    toast("Sign in as an admin to publish content")
};

function mediaMarkup(url, type) {
    if (!url) return '<div class="media-placeholder"><span class="play">▶</span><strong>FIELD FOOTAGE</strong><small>Featured media coming soon</small></div>';
    return type === "video" ? `<video src="${esc(url)}" controls playsinline></video>` : `<img src="${esc(url)}" alt="Featured CODM media">`
}

function renderFeature() {
    const f = records.find(x => x.type === "feature");
    if (!f) {
        $("featureMedia").innerHTML = mediaMarkup();
        return
    }
    $("featureMedia").innerHTML = mediaMarkup(f.media_url, f.media_type);
    $("featureTitle").innerHTML = esc(f.title || "Featured drop");
    $("featureDesc").textContent = f.description || ""
}

function renderLoadouts() {
    let arr = records.filter(x => x.type === "loadout");
    const q = $("search").value.toLowerCase(),
        cat = $("category").value;
    arr = arr.filter(x => (`${x.title} ${x.category} ${x.description}`.toLowerCase().includes(q)) && (!cat || x.category === cat));
    $("buildCount").textContent = records.filter(x => x.type === "loadout").length.toString().padStart(2, "0");
    $("loadoutGrid").innerHTML = arr.length ? arr.map(x => {
        let at = Array.isArray(x.data) ? x.data : (x.data?.attachments || []);
        const txt = `${x.title}\\n${(at || []).map(a => typeof a === "string" ? a : `${a.slot || ""}: ${a.name || a}`).join("\\n")}`;
        return `<article class="loadout-card"><div class="card-top"><span class="card-category">${esc(x.category || "WEAPON BUILD")}</span><span class="pill">${esc(x.code || "BUILD")}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.description || "Community weapon configuration.")}</p><ul class="attachment-list">${at.map(a => `<li><span>${esc(typeof a === "string" ? "ATTACHMENT" : a.slot || "ATTACHMENT")}</span><b>${esc(typeof a === "string" ? a : a.name || "")}</b></li>`).join("")}</ul><button class="copy-btn" data-copy="${esc(txt)}">▣ COPY BUILD</button></article>`
    }).join("") : '<div class="empty">NO BUILDS MATCH. TRY ANOTHER SEARCH.</div>';
    document.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => copy(b.dataset.copy))
}

function renderSettings() {
    for (const [type, id] of [
            ["hud", "hudList"],
            ["sensitivity", "sensList"],
            ["graphics", "graphicsList"]
        ]) {
        let arr = records.filter(x => x.type === "setting" && x.category === type);
        $(id).innerHTML = arr.length ? arr.map(x => `<div class="setting-row"><div><b>${esc(x.title)}</b><small>${esc(x.description || "")}</small></div><button class="copy-btn" style="width:auto" data-setting="${esc(JSON.stringify(x.data || {}))}">COPY</button></div>`).join("") : '<div class="setting-row"><span class="muted">No presets published yet.</span></div>'
    }
    document.querySelectorAll("[data-setting]").forEach(b => b.onclick = () => copy(JSON.stringify(JSON.parse(b.dataset.setting), null, 2)))
}
async function load() {
    if (!db) {
        $("buildCount").textContent = "00";
        $("loadoutGrid").innerHTML = '<div class="empty">DATABASE NOT CONNECTED — add Supabase URL and anon key in app.js, then publish.</div>';
        renderFeature();
        renderSettings();
        return
    }
    const {
        data,
        error
    } = await db.from("content").select("*").eq("published", true).order("created_at", {
        ascending: false
    });
    if (error) {
        toast("Database error: " + error.message);
        return
    }
    records = data || [];
    renderLoadouts();
    renderFeature();
    renderSettings()
}
$("search").addEventListener("input", renderLoadouts);
$("category").addEventListener("change", renderLoadouts);
$("loginForm").onsubmit = async e => {
    e.preventDefault();
    if (!db) {
        $("adminStatus").textContent = "Configure Supabase URL and anon key in app.js first.";
        return
    }
    const {
        data,
        error
    } = await db.auth.signInWithPassword({
        email: $("adminEmail").value,
        password: $("adminPassword").value
    });
    if (error) {
        $("adminStatus").textContent = error.message;
        return
    }
    currentUser = data.user;
    $("adminStatus").textContent = "Authenticated. Admin permissions are enforced by database row-level security.";
    $("adminPanel").hidden = false;
    renderAdminItems()
};
const fieldDefs = {
    loadout: [
        ["title", "Weapon name", "text"],
        ["category", "Weapon class", "select:Assault Rifle,SMG,Sniper,LMG,Shotgun,Marksman"],
        ["code", "Build code", "text"],
        ["description", "Description", "textarea"],
        ["data", "Attachments (JSON array)", "textarea"]
    ],
    setting: [
        ["title", "Preset name", "text"],
        ["category", "Preset category", "select:hud,sensitivity,graphics"],
        ["description", "Description", "textarea"],
        ["data", "Settings data (JSON)", "textarea"]
    ],
    feature: [
        ["title", "Feature title", "text"],
        ["description", "Description", "textarea"],
        ["media_url", "Image/video URL", "url"],
        ["media_type", "Media type", "select:image,video"]
    ]
};

function buildFields() {
    const t = $("contentType").value;
    $("dynamicFields").innerHTML = fieldDefs[t].map(([id, label, type]) => `<label>${label}${type.startsWith("select:") ? `<select id="f_${id}">${type.slice(7).split(",").map(v => `<option>${v}</option>`).join("")}</select>` : type === "textarea" ? `<textarea id="f_${id}" rows="4" ${id === "data" ? 'placeholder=\'[{"slot":"Muzzle","name":"Example"}]\'' : ''}></textarea>` : `<input id="f_${id}" type="${type}" ${id === "title" ? "required" : ""}>`}</label>`).join("")
}
$("contentType").onchange = buildFields;
buildFields();
async function renderAdminItems() {
    if (!db || !currentUser) return;
    const {
        data
    } = await db.from("content").select("*").order("created_at", {
        ascending: false
    });
    $("adminItems").innerHTML = (data || []).map(x => `<div class="admin-item"><span>${esc(x.title)} <small>(${esc(x.type)})</small></span><button data-delete="${x.id}">DELETE</button></div>`).join("") || '<p class="muted">No content yet.</p>';
    document.querySelectorAll("[data-delete]").forEach(b => b.onclick = async () => {
        if (!confirm("Delete this content?")) return;
        const {
            error
        } = await db.from("content").delete().eq("id", b.dataset.delete);
        if (error) toast(error.message);
        else {
            toast("Content deleted");
            await load();
            renderAdminItems()
        }
    })
}
$("contentForm").onsubmit = async e => {
    e.preventDefault();
    if (!db || !currentUser) return;
    const type = $("contentType").value,
        obj = {
            type,
            title: $("f_title").value,
            description: $("f_description")?.value || "",
            published: true
        };
    if (type === "loadout") {
        obj.category = $("f_category").value;
        obj.code = $("f_code").value;
        try {
            obj.data = JSON.parse($("f_data").value || "[]")
        } catch {
            toast("Attachments must be valid JSON");
            return
        }
    } else if (type === "setting") {
        obj.category = $("f_category").value;
        try {
            obj.data = JSON.parse($("f_data").value || "{}")
        } catch {
            toast("Settings must be valid JSON");
            return
        }
    } else {
        obj.media_url = $("f_media_url").value;
        obj.media_type = $("f_media_type").value
    }
    const {
        error
    } = await db.from("content").insert(obj);
    if (error) {
        toast(error.message);
        return
    }
    toast("Published to online database");
    e.target.reset();
    buildFields();
    await load();
    renderAdminItems()
};
load();
