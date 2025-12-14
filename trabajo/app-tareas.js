// ===== UTILIDADES =====
function getMateriaFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('materia') || 'matematicas';
}

function loadJSON(key, def) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : def;
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Sesión / rol
const rol = localStorage.getItem('rol-actual');
const estCedula = localStorage.getItem('estudiante-actual');
const profMateria = localStorage.getItem('profesor-materia');

function cerrarSesion() {
  clearSesionTotal();
  window.location.href = 'login.html';
}

// Proteger acceso básico
if (!rol && !estCedula) {
  window.location.href = 'login.html';
}

// Perfil lateral (usa getUsuarios() definido en auth.js)
(function cargarPerfil() {
  const nombreEl = document.getElementById('profile-nombre');
  const idEl = document.getElementById('profile-id');
  const emailEl = document.getElementById('profile-email');
  const rolEl = document.getElementById('profile-rol');

  if (rol === 'profesor' && profMateria) {
    nombreEl.textContent = 'Profesor de ' + profMateria.charAt(0).toUpperCase() + profMateria.slice(1);
    idEl.textContent = 'Usuario: ' + profMateria;
    emailEl.textContent = 'Correo: profesor-' + profMateria + '@unesum.edu.ec';
    rolEl.textContent = 'Rol: Docente';
  } else if (estCedula) {
    const usuarios = getUsuarios();
    const u = usuarios.find(x => x.cedula === estCedula);
    if (u) {
      nombreEl.textContent = u.nombre;
      idEl.textContent = 'Cédula: ' + u.cedula;
      emailEl.textContent = 'Correo: ' + (u.correo || 'no definido');
      rolEl.textContent = 'Rol: Estudiante';
    } else {
      nombreEl.textContent = 'Estudiante';
      idEl.textContent = 'Cédula: ' + estCedula;
      rolEl.textContent = 'Rol: Estudiante';
    }
  }
})();

// ===== CONTEXTO DE MATERIA =====
const materia = getMateriaFromURL();
document.getElementById('tareas-materia-titulo').textContent =
  'Tareas de ' + materia.charAt(0).toUpperCase() + materia.slice(1);

// Panel profesor visible solo si es docente de esta materia
const profesorPanel = document.getElementById('profesor-panel');
const formNuevaTarea = document.getElementById('form-nueva-tarea');

if (rol === 'profesor' && profMateria === materia) {
  profesorPanel.style.display = 'block';
  document.getElementById('profesor-tutor-titulo').textContent =
    'Tutor de ' + materia.charAt(0).toUpperCase() + materia.slice(1);
} else {
  profesorPanel.style.display = 'none';
}

// ===== TAREAS POR MATERIA =====
const STORAGE_TAREAS = 'tareas-' + materia;
let tareas = loadJSON(STORAGE_TAREAS, []);
let tareaSeleccionadaId = null;

// Crear nueva tarea (solo profesor dueño de materia)
if (formNuevaTarea) {
  formNuevaTarea.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!(rol === 'profesor' && profMateria === materia)) return;

    const titulo = document.getElementById('tarea-titulo').value.trim();
    const desc = document.getElementById('tarea-descripcion').value.trim();
    const fechaPub = document.getElementById('tarea-fecha-publicacion').value;
    const fechaLim = document.getElementById('tarea-fecha-limite').value;
    const horaLim = document.getElementById('tarea-hora-limite').value;

    if (!titulo || !fechaPub || !fechaLim || !horaLim) {
      alert('Completa los campos obligatorios de la tarea.');
      return;
    }

    const nueva = {
      id: Date.now().toString(),
      titulo,
      descripcion: desc,
      fechaPublicacion: fechaPub,
      fechaLimite: fechaLim,
      horaLimite: horaLim
    };
    tareas.push(nueva);
    saveJSON(STORAGE_TAREAS, tareas);
    formNuevaTarea.reset();
    renderListaTareas();
  });
}

function estadoTarea(t) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (hoy > t.fechaLimite) return 'Cerrada';
  return 'Abierta';
}

function renderListaTareas() {
  const tbody = document.getElementById('tabla-tareas');
  tbody.innerHTML = '';

  tareas.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.titulo}</td>
      <td>${t.fechaPublicacion}</td>
      <td>${t.fechaLimite} ${t.horaLimite}</td>
      <td>${estadoTarea(t)}</td>
      <td><button type="button" onclick="verTarea('${t.id}')">Ver</button></td>
    `;
    tbody.appendChild(tr);
  });
}

window.verTarea = function (id) {
  tareaSeleccionadaId = id;
  const t = tareas.find(x => x.id === id);
  if (!t) return;

  const card = document.getElementById('detalle-tarea-card');
  const detTitulo = document.getElementById('detalle-titulo');
  const detDesc = document.getElementById('detalle-descripcion');
  const detFechas = document.getElementById('detalle-fechas');

  detTitulo.textContent = t.titulo;
  detDesc.textContent = t.descripcion || 'Sin descripción.';
  detFechas.textContent =
    'Publicada el ' + t.fechaPublicacion +
    ' · Entrega hasta ' + t.fechaLimite + ' ' + t.horaLimite;

  card.style.display = 'block';

  const divEst = document.getElementById('detalle-estudiante');
  const divProf = document.getElementById('detalle-profesor');

  if (rol === 'profesor' && profMateria === materia) {
    divProf.style.display = 'block';
    divEst.style.display = 'none';
    renderEntregasProfesor(id);
    renderAsistenciasProfesor(id);
  } else {
    divProf.style.display = 'none';
    divEst.style.display = 'block';
    cargarMiEntrega(id);
    cargarMiAsistencia(id);
    renderChatTarea();
  }
};

// ===== ENTREGAS =====
function keyEntregas(idTarea) {
  return 'entregas-' + materia + '-' + idTarea;
}

function cargarMiEntrega(idTarea) {
  if (!estCedula) return;
  const key = keyEntregas(idTarea);
  const entregas = loadJSON(key, []);
  const mi = entregas.find(e => e.cedula === estCedula);

  const estadoEl = document.getElementById('estado-mi-entrega');
  const input = document.getElementById('entrega-texto');

  if (!estadoEl || !input) return;

  if (mi) {
    estadoEl.textContent = 'Última entrega: ' + mi.texto + ' · ' + mi.fechaHora;
    input.value = mi.texto;
  } else {
    estadoEl.textContent = 'Aún no has enviado esta tarea.';
    input.value = '';
  }
}

const formEntrega = document.getElementById('form-entrega');
if (formEntrega) {
  formEntrega.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!estCedula || !tareaSeleccionadaId) return;

    const texto = document.getElementById('entrega-texto').value.trim();
    if (!texto) {
      alert('Escribe algo o pega un enlace como entrega.');
      return;
    }

    const key = keyEntregas(tareaSeleccionadaId);
    const entregas = loadJSON(key, []);
    const ahora = new Date().toLocaleString();

    const idx = entregas.findIndex(en => en.cedula === estCedula);
    if (idx >= 0) {
      entregas[idx].texto = texto;
      entregas[idx].fechaHora = ahora;
    } else {
      entregas.push({ cedula: estCedula, texto, fechaHora: ahora });
    }
    saveJSON(key, entregas);
    cargarMiEntrega(tareaSeleccionadaId);
  });
}

function renderEntregasProfesor(idTarea) {
  const key = keyEntregas(idTarea);
  const entregas = loadJSON(key, []);
  const tbody = document.getElementById('tabla-entregas-tarea');
  tbody.innerHTML = '';

  entregas.forEach(en => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${en.cedula}</td>
      <td>${en.texto}</td>
      <td>${en.fechaHora}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== ASISTENCIA POR TAREA =====
function keyAsistencia(idTarea) {
  return 'asistencia-' + materia + '-' + idTarea;
}

function cargarMiAsistencia(idTarea) {
  if (!estCedula) return;

  const key = keyAsistencia(idTarea);
  const asistencias = loadJSON(key, []);
  const mi = asistencias.find(a => a.cedula === estCedula);

  const chk = document.getElementById('asistencia-check');
  const estado = document.getElementById('estado-mi-asistencia');
  if (!chk || !estado) return;

  if (mi && mi.asistio) {
    chk.checked = true;
    estado.textContent = 'Asistencia registrada el ' + mi.fechaHora;
  } else {
    chk.checked = false;
    estado.textContent = 'Aún no has marcado tu asistencia para esta clase.';
  }
}

const formAsistencia = document.getElementById('form-asistencia');
if (formAsistencia) {
  formAsistencia.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!estCedula || !tareaSeleccionadaId) return;

    const chk = document.getElementById('asistencia-check');
    const key = keyAsistencia(tareaSeleccionadaId);
    const asistencias = loadJSON(key, []);
    const ahora = new Date().toLocaleString();

    const idx = asistencias.findIndex(a => a.cedula === estCedula);
    if (idx >= 0) {
      asistencias[idx].asistio = chk.checked;
      asistencias[idx].fechaHora = ahora;
    } else {
      asistencias.push({
        cedula: estCedula,
        asistio: chk.checked,
        fechaHora: ahora
      });
    }

    saveJSON(key, asistencias);
    cargarMiAsistencia(tareaSeleccionadaId);
  });
}

function renderAsistenciasProfesor(idTarea) {
  const key = keyAsistencia(idTarea);
  const asistencias = loadJSON(key, []);
  const tbody = document.getElementById('tabla-asistencias-tarea');
  tbody.innerHTML = '';

  asistencias.forEach(as => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${as.cedula}</td>
      <td>${as.asistio ? 'Sí' : 'No'}</td>
      <td>${as.fechaHora}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== CHAT ESTUDIANTE-DOCENTE POR TAREA (sin IA) =====
function keyChat() {
  return 'chat-' + materia + '-' + tareaSeleccionadaId + '-' + estCedula;
}

function renderChatTarea() {
  const box = document.getElementById('chat-tarea');
  if (!box || !tareaSeleccionadaId || !estCedula) return;

  const mensajes = loadJSON(keyChat(), []);
  box.innerHTML = '';
  mensajes.forEach(m => {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${m.de}:</strong> ${m.texto}`;
    box.appendChild(p);
  });
  box.scrollTop = box.scrollHeight;
}

window.enviarMensajeTarea = function () {
  if (!tareaSeleccionadaId || !estCedula) return;

  const input = document.getElementById('chat-tarea-input');
  const texto = (input.value || '').trim();
  if (!texto) return;

  const key = keyChat();
  const mensajes = loadJSON(key, []);
  mensajes.push({ de: 'Estudiante', texto });
  saveJSON(key, mensajes);
  input.value = '';
  renderChatTarea();
};

// Inicializar lista
renderListaTareas();
