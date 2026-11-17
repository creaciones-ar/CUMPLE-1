/* ===== CONFIGURACIÓN (editar solo acá) ===== */
const CONFIG = {
  fecha: "December 20, 2026 14:00:00",        // domingo 20 de diciembre, 14:00
  musica: "musica.mp3",                       // archivo de la canción "Tú haces que mi mundo brille". Vacío = no aparece el reproductor
  whatsapp: "5491161238037",                  // 54 + 9 + número (+54 11 6123 8037)
  mapsUrl: "https://maps.app.goo.gl/nawsaayhWtxreLaU6?g_st=iw",   // Quinta La Pepa. Vacío = no aparece el botón
  confirmarAntes: "Confirmar antes del 1 de diciembre",                         // Ej: "Confirmar antes del 10 de diciembre". Vacío = no aparece
  mensajeWa: "Hola! Confirmo mi asistencia al primer añito de Isabella"
};

const $ = id => document.getElementById(id);

/* ===== Secciones opcionales: aparecen solo si hay dato en CONFIG ===== */
const show = (...ids) => ids.forEach(i => $(i).classList.remove('hidden'));
$('wa-btn').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensajeWa)}`;
if (CONFIG.mapsUrl) { $('maps-btn').href = CONFIG.mapsUrl; show('maps-btn'); }
if (CONFIG.confirmarAntes) { $('confirm-note').textContent = CONFIG.confirmarAntes; show('confirm-note'); }
if (!CONFIG.musica) $('player').classList.add('hidden');   // sin canción no hay reproductor

/* ===== Música (archivo mp3 + reproductor propio) ===== */
const audio = new Audio(CONFIG.musica || '');
audio.loop = true;                               // repetir activado desde el inicio
audio.preload = 'auto';
let wantPlay = false, userPaused = false, needResume = false;   // userPaused: pausó a propósito
const playBtn = $('btn-play'), bar = $('progress');

audio.addEventListener('play', () => playBtn.classList.add('playing'));
audio.addEventListener('pause', () => playBtn.classList.remove('playing'));
audio.addEventListener('timeupdate', () => { if (audio.duration) bar.value = audio.currentTime / audio.duration * 100; });

playBtn.onclick = () => {
  if (audio.paused) { userPaused = false; audio.play().catch(() => {}); }
  else { userPaused = true; audio.pause(); }
};
bar.oninput = () => { if (audio.duration) audio.currentTime = audio.duration * bar.value / 100; };
$('btn-prev').onclick = $('btn-next').onclick = () => { userPaused = false; audio.currentTime = 0; audio.play().catch(() => {}); };
$('btn-repeat').onclick = e => { e.currentTarget.classList.toggle('on'); audio.loop = e.currentTarget.classList.contains('on'); };
$('btn-shuffle').onclick = e => e.currentTarget.classList.toggle('on');

/* ===== Abrir sobre: tocar el sello -> se rompe, se abre la solapa, sube la carta, entra la invitación ===== */
$('open-btn').addEventListener('click', function () {
  const env = $('envelope'), screen = $('welcome-screen');
  if (env.classList.contains('open')) return;      // evita doble toque
  env.classList.add('open');
  screen.classList.add('opening');
  wantPlay = true;
  if (CONFIG.musica) audio.play().catch(() => { needResume = true; });   // la música arranca con el toque
  setTimeout(() => {
    screen.style.opacity = '0';
    setTimeout(() => {
      screen.classList.add('hidden');
      $('main-content').classList.remove('hidden');
      fitStory();
      window.scrollTo(0, 0);
    }, 600);
  }, 2900);                                         // tiempo que dura la animación del sobre
});

/* ===== Cuenta regresiva ===== */
const eventDate = new Date(CONFIG.fecha).getTime();
const pad = n => String(n).padStart(2, '0');
const tick = () => {
  const d = eventDate - Date.now();
  if (d < 0) { clearInterval(timer); $('countdown').textContent = '¡Llegó el gran día!'; return; }
  $('days').textContent = pad(Math.floor(d / 864e5));
  $('hours').textContent = pad(Math.floor(d % 864e5 / 36e5));
  $('minutes').textContent = pad(Math.floor(d % 36e5 / 6e4));
  $('seconds').textContent = pad(Math.floor(d % 6e4 / 1e3));
};
const timer = setInterval(tick, 1000);
tick();

/* ===== Fotos: busca automáticamente el archivo correcto =====
   Prueba: foto3.jpg, "foto 3.jpg", foto_3.jpg, .png, .jpeg, .webp (y mayúsculas).
   Las que tienen data-framed (marco rosado incluido en la imagen) reciben la clase "framed". */
const V = '2';
const NAMES = n => [`foto${n}`, `foto ${n}`, `foto_${n}`];
const EXTS = ['jpg', 'png', 'jpeg', 'webp', 'JPG', 'PNG', 'JPEG'];

function candidates(n) {
  const list = [];
  NAMES(n).forEach(name => EXTS.forEach(ext => list.push(encodeURI(`${name}.${ext}`) + '?v=' + V)));
  return list;
}

function loadPhoto(img) {
  const list = candidates(img.dataset.foto);
  const framed = img.hasAttribute('data-framed');
  let i = 0;
  const next = () => {
    if (i >= list.length) { console.warn('No se encontró la foto', img.dataset.foto); return; }
    const probe = new Image();
    const url = list[i++];
    probe.onload = () => { img.src = url; if (framed) img.classList.add('framed'); };
    probe.onerror = next;
    probe.src = url;
  };
  next();
}

document.querySelectorAll('img[data-foto]').forEach(loadPhoto);

/* ===== Texto de la historia: mismo alto que las dos fotos =====
   Ajusta el tamaño de letra hasta que el texto empiece a la altura de la 1ª foto
   y termine a la altura de la 2ª (en cualquier celular). */
function fitStory() {
  const t = document.querySelector('.story-text');
  const box = document.querySelector('.story-photos');
  if (!t || !box || !box.offsetHeight) return;      // todavía oculto o sin cargar
  const target = box.offsetHeight * 0.96;
  let lo = 11, hi = 28;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    t.style.fontSize = mid + 'px';
    if (t.scrollHeight > target) hi = mid; else lo = mid;
  }
  t.style.fontSize = lo + 'px';
}
document.querySelectorAll('.story-photos img').forEach(i => i.addEventListener('load', fitStory));
window.addEventListener('resize', fitStory);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStory);

/* ===== Al volver de Google Maps u otra app, la música sigue sola ===== */
function resumeMusic() {
  if (!CONFIG.musica || !wantPlay || userPaused || !audio.paused) return;
  audio.play().catch(() => { needResume = true; });   // si el celular lo bloquea, se reanuda con el próximo toque
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(resumeMusic, 300); });
window.addEventListener('pageshow', () => setTimeout(resumeMusic, 300));
document.addEventListener('touchend', e => {
  if (!needResume || e.target.closest('.controls')) return;
  needResume = false;
  if (!userPaused && audio.paused) audio.play().catch(() => {});
}, { passive: true });

/* ===== El ícono del calendario se anima una sola vez: se reinicia al llegar a verlo ===== */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.target.getAttribute('src')) { const im = e.target; im.src = im.src.split('?')[0] + '?t=' + Date.now(); }
  }), { threshold: 0.6 });
  document.querySelectorAll('img[data-replay]').forEach(i => io.observe(i));
}

/* ===== Íconos animados: busca el archivo con o sin "_1" en el nombre (icono-camara_1.gif o icono-camara.gif) ===== */
document.querySelectorAll('img[data-icon]').forEach(img => {
  const n = img.dataset.icon, list = [`${n}_1.gif`, `${n}.gif`, `${n}_1.GIF`, `${n}.GIF`];
  let i = 0;
  const next = () => {
    if (i >= list.length) { console.warn('No se encontró el ícono', n); return; }
    const p = new Image(), u = list[i++] + '?v=1';
    p.onload = () => { img.src = u; };
    p.onerror = next;
    p.src = u;
  };
  next();
});
