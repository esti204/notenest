/* ============================================
   NoteNest — script.js
   Author : Saad Iqbal Esti
   Connected to Supabase (NoteNestNew)
   ============================================ */

'use strict';

const SUPABASE_URL = 'https://dnluranwcalzlvyzwakf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHVyYW53Y2Fsemx2eXp3YWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTE0NzUsImV4cCI6MjA4OTIyNzQ3NX0.UAfrZfmegNqTLZM3aJYqRR06xQYbg1cBgxRI26Q_zUQ';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ════════════════════════
   PAGE ROUTER
════════════════════════ */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (!pg) return;
  pg.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.querySelectorAll('.nl').forEach(b => b.classList.remove('act'));
  const map = {
    home:      'nl-home',
    browse:    'nl-browse',
    upload:    'nl-upload',
    dashboard: 'nl-dash',
    contact:   'nl-contact'
  };
  if (map[id]) document.getElementById(map[id])?.classList.add('act');
  closeMobMenu();

  if (id === 'browse')    loadNotes(document.getElementById('browseNotes'), 'All');
  if (id === 'dashboard') loadDashboard();
}

/* ════════════════════════
   MOBILE MENU
════════════════════════ */
function toggleMobMenu() {
  document.getElementById('mobDrawer').classList.toggle('open');
}
function closeMobMenu() {
  document.getElementById('mobDrawer')?.classList.remove('open');
}

/* ════════════════════════
   AUTH TABS
════════════════════════ */
function setTab(tab) {
  ['login', 'signup'].forEach(t => {
    document.getElementById(t + 'Form').style.display = t === tab ? 'block' : 'none';
    document.getElementById(t + 'Tab').classList.toggle('active', t === tab);
  });
}

/* ════════════════════════
   TOAST
════════════════════════ */
function toast(msg, type) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.innerHTML = msg;
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), 3200);
}

/* ════════════════════════
   SHOW EMPTY STATE
════════════════════════ */
function showEmpty(container, icon, title, sub) {
  icon  = icon  || '📂';
  title = title || 'Nothing here yet.';
  sub   = sub   || '';
  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:clamp(40px,8vw,80px) 0;color:var(--tmut);">
      <div style="font-size:clamp(2.5rem,6vw,3.5rem);margin-bottom:14px;">${icon}</div>
      <div style="font-family:var(--fh);font-weight:700;font-size:clamp(.95rem,2vw,1.1rem);color:var(--ts);">${title}</div>
      ${sub ? `<div style="font-size:.84rem;margin-top:6px;color:var(--tmut);">${sub}</div>` : ''}
    </div>`;
}

/* ════════════════════════
   TAG COLOR MAP
════════════════════════ */
const TAG_MAP = {
  'Mathematics':      'tag-blue',
  'Physics':          'tag-amber',
  'Chemistry':        'tag-cyan',
  'Biology':          'tag-green',
  'Computer Science': 'tag-purple',
  'English':          'tag-gray',
  'Economics':        'tag-red'
};

/* ════════════════════════
   NOTE CARD HTML
════════════════════════ */
function noteCardHTML(note) {
  const tagCls = TAG_MAP[note.subject] || 'tag-gray';
  return `
    <div class="note-card card" onclick="openDetail('${note.id}')">
      <div class="nc-subject"><span class="tag ${tagCls}">${note.subject || 'General'}</span></div>
      <div class="nc-title">${note.title}</div>
      <div class="nc-desc">${note.description}</div>
      <div class="nc-footer">
        <div class="nc-meta">
          <span>📄 ${note.pages || '?'}p</span>
          <span>⬇️ ${(note.downloads || 0).toLocaleString()}</span>
          <span>👤 ${note.author_name || 'Anonymous'}</span>
        </div>
        <button class="nc-dl" onclick="event.stopPropagation(); handleDownload('${note.id}', '${note.file_url}')">⬇️ Save</button>
      </div>
    </div>`;
}

/* ════════════════════════
   LOAD NOTES
════════════════════════ */
async function loadNotes(container, filter) {
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--tmut);">Loading notes…</div>`;

  let query = sb.from('notes').select('*').order('created_at', { ascending: false });
  if (filter && filter !== 'All') query = query.eq('subject', filter);

  const { data, error } = await query;

  if (error) {
    showEmpty(container, '⚠️', 'Failed to load notes.', error.message);
    return;
  }
  if (!data || data.length === 0) {
    showEmpty(container, '📚', 'No notes yet.', 'Be the first to upload a note for your peers!');
    return;
  }
  container.innerHTML = data.map(n => noteCardHTML(n)).join('');
}

/* ════════════════════════
   OPEN NOTE DETAIL
════════════════════════ */
async function openDetail(id) {
  showPage('detail');

  const { data, error } = await sb.from('notes').select('*').eq('id', id).single();
  if (error || !data) { toast('Could not load note details.', 'error'); return; }

  const tagCls = TAG_MAP[data.subject] || 'tag-gray';
  document.getElementById('dt-tag').textContent      = data.subject;
  document.getElementById('dt-tag').className        = 'tag ' + tagCls;
  document.getElementById('dt-title').textContent    = data.title;
  document.getElementById('dt-author').textContent   = data.author_name || 'Anonymous';
  document.getElementById('dt-date').textContent     = new Date(data.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  document.getElementById('dt-dl').textContent       = (data.downloads || 0).toLocaleString() + ' downloads';
  document.getElementById('dt-pages').textContent    = (data.pages || '—') + ' pages';
  document.getElementById('dt-desc').textContent     = data.description;
  document.getElementById('dt-subj').textContent     = data.subject;
  document.getElementById('dt-filesize').textContent = data.file_size || '—';
  document.getElementById('dt-filename').textContent = data.file_name || 'document.pdf';
  document.getElementById('dt-dl-btn').onclick       = () => handleDownload(data.id, data.file_url);
  document.getElementById('dt-preview-url').value = data.file_url || '';
}

/* ════════════════════════
   DOWNLOAD NOTE
════════════════════════ */
async function handleDownload(id, fileUrl) {
  if (!fileUrl) { toast('No file available for download.', 'warn'); return; }
  const { data } = await sb.from('notes').select('downloads').eq('id', id).single();
  if (data) {
    await sb.from('notes').update({ downloads: (data.downloads || 0) + 1 }).eq('id', id);
  }
  window.open(fileUrl, '_blank');
  toast('📥 Download started!', 'success');
}
/* ════════════════════════
   PREVIEW NOTE
════════════════════════ */
function previewNote() {
  const url = document.getElementById('dt-preview-url')?.value;
  if (!url) {
    toast('⚠️ No preview available for this note.', 'warn');
    return;
  }
  window.open(url, '_blank');
}

/* ════════════════════════
   FILE INPUT HANDLER
════════════════════════ */
function handleFileInput(input) {
  const f = input.files[0];
  if (!f) return;
  if (f.type !== 'application/pdf') {
    toast('⚠️ Only PDF files are accepted.', 'warn');
    input.value = '';
    return;
  }
  if (f.size > 25 * 1024 * 1024) {
    toast('⚠️ File must be under 25 MB.', 'warn');
    input.value = '';
    return;
  }
  const el = document.getElementById('fileInfo');
  el.style.display = 'block';
  el.innerHTML = `✅ &nbsp;<b>${f.name}</b> &nbsp;·&nbsp; ${(f.size / 1024 / 1024).toFixed(2)} MB`;
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('over');
  const f = e.dataTransfer.files[0];
  if (!f || f.type !== 'application/pdf') {
    toast('⚠️ Only PDF files are accepted.', 'warn');
    return;
  }
  if (f.size > 25 * 1024 * 1024) {
    toast('⚠️ File must be under 25 MB.', 'warn');
    return;
  }
  const el = document.getElementById('fileInfo');
  el.style.display = 'block';
  el.innerHTML = `✅ &nbsp;<b>${f.name}</b> &nbsp;·&nbsp; ${(f.size / 1024 / 1024).toFixed(2)} MB`;
  window._droppedFile = f;
}

/* ════════════════════════
   UPLOAD NOTE
════════════════════════ */
async function submitUpload() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    toast('⚠️ Please log in to upload notes.', 'warn');
    showPage('auth');
    return;
  }

  const title    = document.getElementById('uTitle').value.trim();
  const subject  = document.getElementById('uSubject').value;
  const desc     = document.getElementById('uDesc').value.trim();
  const dept     = document.getElementById('uDept').value.trim();
  const keywords = document.getElementById('uKeywords').value.trim();
  const file     = document.getElementById('fileInput').files[0] || window._droppedFile;

  if (!title)   { toast('⚠️ Please enter a note title.', 'warn');   return; }
  if (!subject) { toast('⚠️ Please select a subject.', 'warn');     return; }
  if (!desc)    { toast('⚠️ Please add a description.', 'warn');    return; }
  if (!file)    { toast('⚠️ Please upload a PDF file.', 'warn');    return; }

  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading…';

  try {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    const { error: uploadError } = await sb.storage
      .from('notenest')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (uploadError) throw uploadError;

    const { data: urlData } = sb.storage
      .from('notenest')
      .getPublicUrl(fileName);

    const { error: dbError } = await sb.from('notes').insert({
      title,
      subject,
      description: desc,
      department:  dept,
      keywords,
      file_url:    urlData.publicUrl,
      file_name:   file.name,
      file_size:   (file.size / 1024 / 1024).toFixed(2) + ' MB',
      pages:       0,
      downloads:   0,
      author_id:   user.id,
      author_name: user.user_metadata?.full_name || user.email.split('@')[0]
    });

    if (dbError) throw dbError;

    toast('🎉 Note published successfully!', 'success');
    resetUpload();
    setTimeout(() => showPage('browse'), 1500);

  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = '🚀 Publish Note';
}

function resetUpload() {
  ['uTitle', 'uDesc', 'uDept', 'uKeywords'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const s = document.getElementById('uSubject');
  if (s) s.value = '';
  document.getElementById('fileInfo').style.display = 'none';
  document.getElementById('fileInput').value = '';
  window._droppedFile = null;
}

/* ════════════════════════
   LOGIN
════════════════════════ */
async function doLogin() {
  const email = document.getElementById('lEmail').value.trim();
  const pass  = document.getElementById('lPass').value;

  if (!email || !email.includes('@')) { toast('⚠️ Enter a valid email address.', 'warn'); return; }
  if (!pass)                          { toast('⚠️ Please enter your password.', 'warn');  return; }

  const btn = document.querySelector('#loginForm .auth-submit');
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });

  if (error) {
    toast('❌ ' + error.message, 'error');
  } else {
    toast('✅ Logged in successfully!', 'success');
    await updateNavForUser();
    setTimeout(() => showPage('dashboard'), 800);
  }

  btn.disabled = false;
  btn.textContent = 'Log In →';
}

/* ════════════════════════
   SIGN UP
════════════════════════ */
async function doSignup() {
  const first = document.getElementById('sFirst').value.trim();
  const last  = document.getElementById('sLast').value.trim();
  const email = document.getElementById('sEmail').value.trim();
  const uni   = document.getElementById('sUni').value.trim();
  const pass  = document.getElementById('sPass').value;
  const pass2 = document.getElementById('sPass2').value;

  if (!first || !last)                { toast('⚠️ Please enter your full name.', 'warn');            return; }
  if (!email || !email.includes('@')) { toast('⚠️ Enter a valid email address.', 'warn');            return; }
  if (pass.length < 6)                { toast('⚠️ Password must be at least 6 characters.', 'warn'); return; }
  if (pass !== pass2)                 { toast('⚠️ Passwords do not match.', 'warn');                 return; }

  const btn = document.querySelector('#signupForm .auth-submit');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  const { data, error } = await sb.auth.signUp({
    email,
    password: pass,
    options: {
      data: { full_name: first + ' ' + last, university: uni }
    }
  });

  if (error) {
    toast('❌ ' + error.message, 'error');
  } else {
    await sb.from('profiles').insert({
      id:         data.user.id,
      full_name:  first + ' ' + last,
      university: uni
    });
    toast('🎉 Account created! Please check your email to confirm.', 'success');
    await updateNavForUser();
    setTimeout(() => showPage('dashboard'), 1000);
  }

  btn.disabled = false;
  btn.textContent = 'Create My Account →';
}

/* ════════════════════════
   GOOGLE AUTH
════════════════════════ */
async function doGoogleAuth() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) toast('❌ ' + error.message, 'error');
}

/* ════════════════════════
   LOGOUT
════════════════════════ */
async function doLogout() {
  await sb.auth.signOut();
  toast('👋 Logged out successfully.', 'success');
  await updateNavForUser();
  showPage('home');
}

/* ════════════════════════
   UPDATE NAV FOR USER
════════════════════════ */
async function updateNavForUser() {
  const { data: { user } } = await sb.auth.getUser();
  const loginBtn  = document.querySelector('.btn-ghost-nav');
  const signupBtn = document.querySelector('.btn-blue-nav');
  if (user) {
    if (loginBtn)  { loginBtn.textContent  = 'Dashboard'; loginBtn.onclick = () => showPage('dashboard'); }
    if (signupBtn) { signupBtn.textContent = 'Log Out';   signupBtn.onclick = doLogout; }
  } else {
    if (loginBtn)  { loginBtn.textContent  = 'Log In';       loginBtn.onclick  = () => { showPage('auth'); setTab('login'); }; }
    if (signupBtn) { signupBtn.textContent = 'Sign Up Free';  signupBtn.onclick = () => { showPage('auth'); setTab('signup'); }; }
  }
}

/* ════════════════════════
   DASHBOARD
════════════════════════ */
async function loadDashboard() {
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    showPage('auth');
    setTab('login');
    toast('⚠️ Please log in to view your dashboard.', 'warn');
    return;
  }

  const el = document.getElementById('myNotesList');
  if (el) el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--tmut);">Loading…</div>';

  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    if (el) showEmpty(el, '📤', 'No notes uploaded yet.', 'Upload your first note to see it here.');
    document.getElementById('dash-total-notes').textContent = '0';
    document.getElementById('dash-total-dl').textContent    = '0';
    return;
  }

  let totalDL = 0;
  data.forEach(n => { totalDL += (n.downloads || 0); });

  document.getElementById('dash-total-notes').textContent = data.length;
  document.getElementById('dash-total-dl').textContent    = totalDL.toLocaleString();

  if (el) {
    el.innerHTML = data.map(n => `
      <div class="my-note-row">
        <div style="display:flex;align-items:center;gap:13px;flex:1;min-width:0;">
          <div class="my-note-icon">📄</div>
          <div style="min-width:0;">
            <div class="my-note-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.title}</div>
            <div class="my-note-sub">${n.subject} &nbsp;·&nbsp; ⬇️ ${(n.downloads || 0).toLocaleString()} downloads</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button class="btn btn-sm btn-outline" onclick="openDetail('${n.id}')">View</button>
          <button class="btn btn-sm btn-red" onclick="deleteNote('${n.id}')">Delete</button>
        </div>
      </div>`).join('');
  }
}

/* ════════════════════════
   DELETE NOTE
════════════════════════ */
async function deleteNote(id) {
  if (!confirm('Are you sure you want to delete this note?')) return;

  const { data: note } = await sb.from('notes').select('file_name').eq('id', id).single();
  if (note?.file_name) {
    await sb.storage.from('notenest').remove([note.file_name]);
  }

  const { error } = await sb.from('notes').delete().eq('id', id);
  if (error) {
    toast('❌ Could not delete note.', 'error');
  } else {
    toast('🗑️ Note deleted.', 'success');
    loadDashboard();
  }
}

/* ════════════════════════
   SEARCH
════════════════════════ */
async function doSearch(src) {
  const inputId = src === 'home' ? 'heroSearch' : 'browseSearch';
  const val = document.getElementById(inputId)?.value.trim();
  if (!val) return;

  showPage('browse');
  const bi = document.getElementById('browseSearch');
  if (bi) bi.value = val;

  const container = document.getElementById('browseNotes');
  if (container) container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--tmut);">Searching…</div>`;

  setTimeout(async () => {
    const { data, error } = await sb
      .from('notes')
      .select('*')
      .or(`title.ilike.%${val}%,subject.ilike.%${val}%,description.ilike.%${val}%,keywords.ilike.%${val}%`)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      showEmpty(container, '🔍', `No results for "${val}"`, 'Try a different keyword.');
    } else {
      container.innerHTML = data.map(n => noteCardHTML(n)).join('');
    }
  }, 100);
}

/* ════════════════════════
   FILTER AND VIEW
════════════════════════ */
function applyFilter(el, subject) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const container = document.getElementById('browseNotes');
  loadNotes(container, subject);
}

function setView(el, type) {
  document.querySelectorAll('.view-btn').forEach(v => v.classList.remove('active'));
  el.classList.add('active');
  const grid = document.getElementById('browseNotes');
  if (!grid) return;
  grid.style.gridTemplateColumns = type === 'list' ? '1fr' : '';
}

/* ════════════════════════
   CONTACT FORM
════════════════════════ */
function submitContact() {
  const name    = document.getElementById('cName').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const subject = document.getElementById('cSubject').value;
  const msg     = document.getElementById('cMsg').value.trim();

  if (!name)                          { toast('⚠️ Please enter your name.', 'warn');    return; }
  if (!email || !email.includes('@')) { toast('⚠️ Enter a valid email.', 'warn');       return; }
  if (!subject)                       { toast('⚠️ Please select a subject.', 'warn');   return; }
  if (!msg)                           { toast('⚠️ Please write your message.', 'warn'); return; }

  toast('✅ Message sent! We will reply to ' + email + ' soon.', 'success');
  ['cName', 'cEmail', 'cMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cSubject').value = '';
}

/* ════════════════════════
   KEYBOARD
════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobMenu();
});

/* ════════════════════════
   INIT
════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await updateNavForUser();
  loadNotes(document.getElementById('browseNotes'), 'All');

  document.getElementById('heroSearch')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch('home');
  });
  document.getElementById('browseSearch')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch('browse');
  });

  sb.auth.onAuthStateChange(async (event) => {
    await updateNavForUser();
    if (event === 'SIGNED_OUT') showPage('home');
  });
});