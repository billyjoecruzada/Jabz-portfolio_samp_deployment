/* ─── TRACK DATA ─── */
const PLACEHOLDER = 'Image%20folder/Temp_placeholder.jpg';

const ALBUM_ART = {
  'Music samples/Shoegaze/Silver Screen.mp3': 'Image%20folder/Music-album%20photos/Silver%20Screen%20Album.jpg',
  'Music samples/Shoegaze/silver threads unwind.wav': 'Image%20folder/Music-album%20photos/Silver%20Threads%20Unwind%20-%20album.jpg',
  'Music samples/Shoegaze/Spin the globe.wav': 'Image%20folder/Music-album%20photos/Spin%20the%20globe%20-%20album.png',
  'Music samples/Shoegaze/Static in the Velveteen.wav': 'Image%20folder/Music-album%20photos/Static%20in%20the%20velveteen%20-%20album.jpg',
};
const getAlbumArt = (t) => ALBUM_ART[t.file] || PLACEHOLDER;

const TRACKS = {
  Pluggnb: [
    { title: 'Fuyu no Asa (冬の朝 - Winter Morning)', file: 'Music samples/Pluggnb/Fuyu no Asa (冬の朝 - Winter Morning).mp3', format: 'mp3' },
    { title: 'Eternal Mistcage', file: 'Music samples/Pluggnb/Eternal Mistcage.wav', format: 'wav' },
    { title: 'Ao no Natsu (青の夏)', file: 'Music samples/Pluggnb/Ao no Natsu (青の夏).wav', format: 'wav' }
  ],
  Shoegaze: [
    { title: 'Silver Screen', file: 'Music samples/Shoegaze/Silver Screen.mp3', format: 'mp3' },
    { title: 'silver threads unwind', file: 'Music samples/Shoegaze/silver threads unwind.wav', format: 'wav' },
    { title: 'Spin the globe', file: 'Music samples/Shoegaze/Spin the globe.wav', format: 'wav' },
    { title: 'Static in the Velveteen', file: 'Music samples/Shoegaze/Static in the Velveteen.wav', format: 'wav' }
  ],
  'Christian Song': [
    { title: 'Lord of Grace', file: 'Music samples/Christian Song/Lord of Grace.wav', format: 'wav' },
    { title: 'The Living Altar', file: 'Music samples/Christian Song/The Living Altar.wav', format: 'wav' }
  ],
  'Lofi - Rap': [
    { title: 'Steam-on-Glass', file: 'Music samples/Lofi - Rap/Steam-on-Glass.wav', format: 'wav' }
  ],
  Phonk: [
    { title: 'ASPHALT DEMON', file: 'Music samples/Phonk/ASPHALT DEMON.wav', format: 'wav' },
    { title: 'NEON GRAVEYARD', file: 'Music samples/Phonk/NEON GRAVEYARD.wav', format: 'wav' },
    { title: 'VELOCITY OVERKILL', file: 'Music samples/Phonk/VELOCITY OVERKILL.wav', format: 'wav' }
  ],
  Synthwave: [
    { title: 'Chasing the Coast', file: 'Music samples/Synthwave/Chasing the Coast.mp3', format: 'mp3' },
    { title: 'In the Glow', file: 'Music samples/Synthwave/In the Glow.mp3', format: 'mp3' },
    { title: 'Midnight Rewind', file: 'Music samples/Synthwave/Midnight Rewind.mp3', format: 'mp3' }
  ]
};

const FEATURED = [
  { title: 'Silver Screen', genre: 'Shoegaze', file: 'Music samples/Shoegaze/Silver Screen.mp3', format: 'mp3' },
  { title: 'Static in the Velveteen', genre: 'Shoegaze', file: 'Music samples/Shoegaze/Static in the Velveteen.wav', format: 'wav' },
  { title: 'silver threads unwind', genre: 'Shoegaze', file: 'Music samples/Shoegaze/silver threads unwind.wav', format: 'wav' },
  { title: 'Steam-on-Glass', genre: 'Lofi - Rap', file: 'Music samples/Lofi - Rap/Steam-on-Glass.wav', format: 'wav' },
  { title: 'NEON GRAVEYARD', genre: 'Phonk', file: 'Music samples/Phonk/NEON GRAVEYARD.wav', format: 'wav' },
  { title: 'In the Glow', genre: 'Synthwave', file: 'Music samples/Synthwave/In the Glow.mp3', format: 'mp3' }
];

/* ─── STATE ─── */
let currentTrack = null;
let isPlaying = false;
let currentGenre = 'All';

/* ─── DOM REFS ─── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const featuredTray = $('#featuredTray');
const scrollLeft = $('#scrollLeft');
const scrollRight = $('#scrollRight');
const genreTabs = $('#genreTabs');
const trackGrid = $('#trackGrid');
const bottomPlayer = $('#bottomPlayer');
const playerThumb = $('#playerThumb');
const playerTrackName = $('#playerTrackName');
const playerGenre = $('#playerGenre');
const playBtn = $('#playBtn');
const playIcon = $('#playIcon');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const muteBtn = $('#muteBtn');
const volumeIcon = $('#volumeIcon');
const progressBar = $('#progressBar');
const progressFill = $('#progressFill');
const volumeBar = $('#volumeBar');
const volumeFill = $('#volumeFill');
const currentTimeEl = $('#currentTime');
const durationEl = $('#duration');
const waveformCanvas = $('#waveformCanvas');
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
const navbar = $('#navbar');

/* ─── AUDIO ENGINE ─── */
const audio = new Audio();
audio.volume = 0.7;

audio.addEventListener('error', () => {
  const err = audio.error;
  console.warn('Audio load error:', err ? err.message || err.code || err : 'unknown');
});

let audioCtx = null;
let analyser = null;
let source = null;
let waveformAnimId = null;
let isSeeking = false;

function initAudioContext() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  } catch (e) {
    console.warn('AudioContext init failed, playing without visualization:', e);
    audioCtx = null;
  }
}

function formatTime(s) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ─── WAVEFORM ─── */
function startWaveform() {
  if (!analyser) {
    // AudioContext unavailable — just show a static visual
    drawStaticWaveform();
    return;
  }
  const ctx = waveformCanvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!isPlaying && audio.paused) {
      ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
      waveformAnimId = null;
      return;
    }
    waveformAnimId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    const w = waveformCanvas.width;
    const h = waveformCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const barCount = bufferLength;
    const barW = w / barCount * 0.8;
    const gap = w / barCount * 0.2;

    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i] / 255;
      const barH = Math.max(2, val * h);
      const x = i * (barW + gap);
      const y = h - barH;

      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, '#FF0000');
      gradient.addColorStop(1, '#E60000');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barW, barH);
    }
  }

  resizeWaveform();
  draw();
}

function drawStaticWaveform() {
  const ctx = waveformCanvas.getContext('2d');
  resizeWaveform();
  const w = waveformCanvas.width;
  const h = waveformCanvas.height;
  ctx.clearRect(0, 0, w, h);
  const barCount = 32;
  const barW = w / barCount * 0.6;
  const gap = w / barCount * 0.4;
  const gradient = ctx.createLinearGradient(0, h, 0, 0);
  gradient.addColorStop(0, '#FF0000');
  gradient.addColorStop(1, '#E60000');
  ctx.fillStyle = gradient;
  for (let i = 0; i < barCount; i++) {
    const barH = Math.max(2, (0.2 + Math.sin(Date.now() * 0.003 + i * 0.5) * 0.15) * h);
    const x = i * (barW + gap);
    const y = h - barH;
    ctx.fillRect(x, y, barW, barH);
  }
  if (isPlaying || !audio.paused) {
    waveformAnimId = requestAnimationFrame(drawStaticWaveform);
  }
}

function resizeWaveform() {
  const rect = waveformCanvas.parentElement.getBoundingClientRect();
  waveformCanvas.width = rect.width || 400;
  waveformCanvas.height = rect.height || 32;
}

function stopWaveform() {
  if (waveformAnimId) {
    cancelAnimationFrame(waveformAnimId);
    waveformAnimId = null;
  }
  const ctx = waveformCanvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
}

window.addEventListener('resize', resizeWaveform);

/* ─── LOAD & PLAY ─── */
async function loadTrack(track) {
  if (currentTrack && currentTrack.file === track.file && !audio.paused) {
    audio.pause();
    return;
  }

  stopWaveform();

  audio.src = encodeURI(track.file);
  audio.load();

  initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  currentTrack = track;
  updatePlayerUI(track);

  audio.play().then(() => {
    isPlaying = true;
    updatePlayButtons();
    startWaveform();
  }).catch((err) => {
    console.warn('Playback failed:', err);
  });
}

async function togglePlay() {
  if (!currentTrack) {
    if (FEATURED.length) loadTrack(FEATURED[0]);
    return;
  }

  if (audio.paused) {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    audio.play().then(() => {
      isPlaying = true;
      updatePlayButtons();
      startWaveform();
    }).catch((err) => {
      console.warn('Playback resume failed:', err);
    });
  } else {
    audio.pause();
    isPlaying = false;
    updatePlayButtons();
    stopWaveform();
  }
}

function playNext() {
  const list = getCurrentPlaylist();
  if (!list.length || !currentTrack) return;
  const idx = list.findIndex(t => t.file === currentTrack.file);
  const next = list[(idx + 1) % list.length];
  loadTrack(next);
}

function playPrev() {
  const list = getCurrentPlaylist();
  if (!list.length || !currentTrack) return;
  const idx = list.findIndex(t => t.file === currentTrack.file);
  const prev = list[(idx - 1 + list.length) % list.length];
  loadTrack(prev);
}

function getCurrentPlaylist() {
  if (currentTrack && FEATURED.some(t => t.file === currentTrack.file)) {
    return FEATURED;
  }
  if (currentTrack) {
    for (const [genre, tracks] of Object.entries(TRACKS)) {
      if (tracks.some(t => t.file === currentTrack.file)) return tracks;
    }
  }
  return getAllTracks();
}

function getAllTracks() {
  return Object.values(TRACKS).flat();
}

/* ─── UI UPDATES ─── */
function updatePlayerUI(track) {
  bottomPlayer.classList.add('visible');
  playerThumb.src = getAlbumArt(track);
  playerTrackName.textContent = track.title;
  playerGenre.textContent = track.genre || findGenreForTrack(track) || 'Featured';
}

function updatePlayButtons() {
  const icon = isPlaying ? 'fa-pause' : 'fa-play';
  playIcon.className = `fas ${icon}`;

  $$('.track-card-play-btn, .featured-play-btn').forEach(btn => {
    const tid = btn.dataset.trackFile;
    if (tid && currentTrack && tid === currentTrack.file) {
      btn.classList.toggle('playing', isPlaying);
      const ico = btn.querySelector('i');
      if (ico) ico.className = `fas ${isPlaying ? 'fa-pause' : 'fa-play'}`;
    } else {
      btn.classList.remove('playing');
      const ico = btn.querySelector('i');
      if (ico) ico.className = 'fas fa-play';
    }
  });
}

/* ─── AUDIO EVENTS ─── */
audio.addEventListener('timeupdate', () => {
  if (!isSeeking) {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progressFill.style.width = `${pct}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  isPlaying = false;
  updatePlayButtons();
  stopWaveform();
  playNext();
});

audio.addEventListener('play', () => {
  isPlaying = true;
  updatePlayButtons();
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  updatePlayButtons();
  stopWaveform();
});

/* ─── PROGRESS SEEK ─── */
progressBar.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

progressBar.addEventListener('mousedown', () => { isSeeking = true; });
progressBar.addEventListener('mouseup', () => { isSeeking = false; });

/* ─── VOLUME ─── */
volumeBar.addEventListener('click', (e) => {
  const rect = volumeBar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.volume = pct;
  volumeFill.style.width = `${pct * 100}%`;
  updateVolumeIcon();
});

muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  updateVolumeIcon();
});

function updateVolumeIcon() {
  if (audio.muted || audio.volume === 0) {
    volumeIcon.className = 'fas fa-volume-mute';
  } else if (audio.volume < 0.5) {
    volumeIcon.className = 'fas fa-volume-down';
  } else {
    volumeIcon.className = 'fas fa-volume-up';
  }
}

/* ─── RENDER FEATURED ─── */
function renderFeatured() {
  featuredTray.innerHTML = FEATURED.map(t => `
    <div class="featured-card reveal" data-file="${t.file}">
      <img src="${getAlbumArt(t)}" alt="${t.title}" class="featured-card-thumb" loading="lazy" />
      <div class="featured-card-body">
        <div class="featured-card-info">
          <h4>${t.title}</h4>
          <span>${t.genre}</span>
        </div>
        <button class="featured-play-btn" data-track-file="${t.file}" aria-label="Play ${t.title}">
          <i class="fas fa-play"></i>
        </button>
      </div>
    </div>
  `).join('');

  featuredTray.querySelectorAll('.featured-card').forEach(card => {
    card.addEventListener('click', () => {
      const file = card.dataset.file;
      const track = FEATURED.find(t => t.file === file);
      if (track) loadTrack(track);
    });
  });
}

/* ─── FEATURED SCROLL ─── */

const SCROLL_AMOUNT = 320;

function updateScrollButtons() {
  const { scrollLeft: sLeft, scrollWidth, clientWidth } = featuredTray;
  scrollLeft.classList.toggle('is-hidden', sLeft <= 4);
  scrollRight.classList.toggle('is-hidden', sLeft + clientWidth >= scrollWidth - 4);
}

featuredTray.addEventListener('scroll', updateScrollButtons);

scrollLeft.addEventListener('click', () => {
  featuredTray.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
});

scrollRight.addEventListener('click', () => {
  featuredTray.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
});

/* ─── RENDER TRACKS ─── */
function renderGenreTabs() {
  const genres = ['All', ...Object.keys(TRACKS)];
  genreTabs.innerHTML = genres.map(g =>
    `<button class="genre-tab${g === currentGenre ? ' active' : ''}" data-genre="${g}">${g}</button>`
  ).join('');

  genreTabs.querySelectorAll('.genre-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      genreTabs.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentGenre = tab.dataset.genre;
      renderTrackGrid();
    });
  });
}

function renderTrackGrid() {
  if (currentGenre === 'All') {
    trackGrid.innerHTML = Object.entries(TRACKS).map(([genre, tracks]) => `
      <div class="genre-collection">
        <div class="genre-collection-header">
          <h3>${genre}</h3>
          <span class="genre-count">${tracks.length} track${tracks.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="track-grid" style="gap: 16px;">
          ${tracks.map(t => `
            <div class="track-card reveal">
              <div class="track-card-thumb-wrap">
                <img src="${getAlbumArt(t)}" alt="${t.title}" class="track-card-thumb" loading="lazy" />
                <div class="track-card-overlay">
                  <button class="track-card-play-btn" data-track-file="${t.file}" aria-label="Play ${t.title}">
                    <i class="fas fa-play"></i>
                  </button>
                </div>
              </div>
              <div class="track-card-body">
                <h4 title="${t.title}">${t.title}</h4>
                <div class="track-card-meta">
                  <span class="track-card-genre">${genre}</span>
                  <span class="track-card-format">${t.format}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } else {
    const tracks = TRACKS[currentGenre] || [];
    trackGrid.innerHTML = tracks.map(t => `
      <div class="track-card reveal">
        <div class="track-card-thumb-wrap">
          <img src="${getAlbumArt(t)}" alt="${t.title}" class="track-card-thumb" loading="lazy" />
          <div class="track-card-overlay">
            <button class="track-card-play-btn" data-track-file="${t.file}" aria-label="Play ${t.title}">
              <i class="fas fa-play"></i>
            </button>
          </div>
        </div>
        <div class="track-card-body">
          <h4 title="${t.title}">${t.title}</h4>
          <div class="track-card-meta">
            <span class="track-card-genre">${currentGenre}</span>
            <span class="track-card-format">${t.format}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  trackGrid.querySelectorAll('.track-card-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const file = btn.dataset.trackFile;
      const track = getAllTracks().find(t => t.file === file);
      if (track) loadTrack(track);
    });
  });
}

function findGenreForTrack(track) {
  for (const [genre, tracks] of Object.entries(TRACKS)) {
    if (tracks.some(t => t.file === track.file)) return genre;
  }
  return 'Unknown';
}

/* ─── NAVIGATION ─── */
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

/* Active nav link on scroll */
const sections = $$('section[id]');
function updateActiveNav() {
  const scrollY = window.scrollY + 150;
  let current = '';

  sections.forEach(sec => {
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    if (scrollY >= top && scrollY < bottom) {
      current = sec.id;
    }
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', () => {
  updateActiveNav();
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ─── REVEAL ON SCROLL ─── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function observeReveals() {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

const mutationObs = new MutationObserver(() => observeReveals());
mutationObs.observe(document.getElementById('featuredTray'), { childList: true, subtree: true });
mutationObs.observe(document.getElementById('trackGrid'), { childList: true, subtree: true });

/* ─── KEYBOARD SHORTCUTS ─── */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') playNext();
  if (e.code === 'ArrowLeft') playPrev();
});

/* ─── INIT ─── */
function init() {
  renderFeatured();
  renderGenreTabs();
  renderTrackGrid();
  observeReveals();
  updateVolumeIcon();

  // Player button handlers
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrev);
  nextBtn.addEventListener('click', playNext);

  // Resize waveform on player open
  resizeWaveform();

  // Sync volume UI with initial 0.7
  volumeFill.style.width = '70%';

  // Featured scroll button state
  updateScrollButtons();
}

document.addEventListener('DOMContentLoaded', init);
