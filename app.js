const mapDiv = L.map('map').setView([52.23, 21.01], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  crossOrigin: true
}).addTo(mapDiv);
let mark;

const geoInfo = document.getElementById('geoInfo');
const snap = document.getElementById('snapCanvas');
const ctx = snap.getContext('2d');
const dl = document.getElementById('dl');
const pool = document.getElementById('pool');
const grid = document.getElementById('grid');
const statusik = document.getElementById('statusik');

const updDl = () => dl.href = snap.toDataURL('image/png');

function goTo(lat, lon, label = 'tu jestem') {
  if (mark) mapDiv.removeLayer(mark);
  mark = L.marker([lat, lon]).addTo(mapDiv).bindPopup(label).openPopup();
  mapDiv.setView([lat, lon], 15);
  geoInfo.textContent = `geo: OK ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  console.log('[GEO] Ustawiono marker na:', lat, lon, 'label:', label);
}

document.getElementById('buttonGeo').onclick = () => {
  if (!navigator.geolocation) { geoInfo.textContent = 'geo: nie działa tu geolokacja'; return; }
  geoInfo.textContent = 'geo: proszę o zgodę...';
  console.log('[GEO] first try');

  navigator.geolocation.getCurrentPosition(onOK, onErr1, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });

  function onOK(p) {
    const { latitude: lat, longitude: lon } = p.coords;
    console.log('[GEO] Sukces:', lat, lon);
    goTo(lat, lon);
  }

  function onErr1(e) {
    console.warn('[GEO] error 1 , second try . Kod:', e?.code);
    geoInfo.textContent = 'geo: second try..';
    navigator.geolocation.getCurrentPosition(onOK, onErr2, {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 600000
    });
  }

  async function onErr2(e) {
    console.warn('[GEO] error 2 , IP search . Kod:', e?.code);
    try {
      geoInfo.textContent = 'geo: IP..';
      const r = await fetch('https://ipapi.co/json/');
      const j = await r.json();
      if (j?.latitude && j?.longitude) {
        console.log('[GEO] Fallback IP:', j.latitude, j.longitude);
        goTo(j.latitude, j.longitude, 'pozycja z IP ');
        return;
      }
      throw new Error('brak  w IP API');
    } catch (err) {
      console.error('[GEO] Nie ma IP. default Warszawa', err);
      geoInfo.textContent = 'geo: nic nie działa, pokaz warszawe';
      goTo(52.2297, 21.0122, 'fallback: Warszawa');
    }
  }
};

document.getElementById('buttonNotif').onclick = async () => {
  if (!('Notification' in window)) return alert('Przegladarka nie obsluguje powiadomien');
  const perm = await Notification.requestPermission();
  console.log('[NOTIFICATION] Permission:', perm);
};

const notifOK = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Puzzle zrobione 🎉', { body: 'Zrób screena ' });
  }
};

document.getElementById('buttonSnap').onclick = () => {
  console.log('[SNAP] Próbuję zrobić screen schota  mapy...');
  window.leafletImage(mapDiv, (err, canv) => {
    if (err || !canv) {
      console.error('[SNAP] Nie udało się .', err);
      return alert('Nie udało się pobrać mapy (CORS?),obrazek zapasowy ');
    }
    ctx.clearRect(0, 0, 512, 512);
    ctx.drawImage(canv, 0, 0, 512, 512);
    updDl();
    console.log('[SNAP] Gotowe. Link do pobrania .');
  });
};

document.getElementById('buttonFallback').onclick = () => {
  console.log('[FALLBACK] Ładuję obrazek zapasowy...');
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.src = 'https://picsum.photos/512';
  im.onload = () => {
    ctx.clearRect(0, 0, 512, 512);
    ctx.drawImage(im, 0, 0, 512, 512);
    updDl();
    console.log('[FALLBACK] Obrazek gotowy.');
  };
  im.onerror = () => alert('Błąd przy ładowaniu zapasowego obrazka');
};


const buildGrid = () => {
  grid.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('div');
    s.className = 'slot';
    s.dataset.index = i;
    s.addEventListener('dragover', e => e.preventDefault());
    s.addEventListener('drop', onDrop);
    grid.appendChild(s);
  }
  console.log('[PUZZLE] Siatka 4x4 gotowa.');
};

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};


const makePieces = () => {
  const w = 128, h = 128; 
  const parts = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const id = r * 4 + c, tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(snap, c * w, r * h, w, h, 0, 0, w, h);
    parts.push({ id, url: tmp.toDataURL('image/png') });
  }

  pool.innerHTML = '';
  shuffle(parts).forEach(p => {
    const img = document.createElement('img');
    img.src = p.url;
    img.width = 100;
    img.height = 100;
    img.className = 'piece';
    img.draggable = true;
    img.dataset.correct = p.id;

    img.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', img.dataset.correct);
      img.classList.add('dragging');
    });
    img.addEventListener('dragend', () => img.classList.remove('dragging'));
    pool.appendChild(img);
  });
  statusik.textContent = 'status: przeciągnij kawałki gdzie trzeba';
  console.log('[PUZZLE] Pocięto na 16 części i wymieszano. Start.');
};


const onDrop = e => {
  e.preventDefault();
  const slot = e.currentTarget;
  const correct = e.dataTransfer.getData('text/plain');
  const dragged = document.querySelector('.piece.dragging');
  if (!dragged) return;

 
  if (slot.firstChild) pool.appendChild(slot.firstChild);
  slot.appendChild(dragged);
  dragged.classList.remove('dragging');

  const ok = slot.dataset.index === correct;
  dragged.style.outline = ok ? '2px solid green' : '2px solid red';
  if (ok) dragged.draggable = false;

  const cells = [...grid.children];
  const placed = cells.filter(s => s.firstChild).length;

 
  console.log('[PUZZLE] Położone:', placed, '/ 16');
  console.table(
    cells.map((s, i) => ({
      slot: i,
      expected: i,
      hasPiece: !!s.firstChild,
      pieceIndex: s.firstChild ? Number(s.firstChild.dataset.correct) : null,
      ok: s.firstChild ? (s.dataset.index === s.firstChild.dataset.correct) : false
    }))
  );

  const done = placed === 16 && cells.every(s => s.firstChild && s.dataset.index === s.firstChild.dataset.correct);
  statusik.textContent = `status: ułożone ${placed}/16` + (done ? ' – gotowe! 🎉' : '');

  if (done) {
    console.log('%c[PUZZLE] OK! Wszystkie elementy są na swoim miejscu ✅', 'color: green; font-weight: bold;');
    notifOK();
  }
};


document.getElementById('buttonDoPuzzle').onclick = () => {
  if (snap.toDataURL('image/png').length < 50)
    return alert('Najpierw zrób mapę albo obrazek zapasowy!');
  buildGrid();
  makePieces();
  console.log('[PUZZLE] Start układania .');
};

buildGrid();
updDl();

