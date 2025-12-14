// ========================
// 1) LÓGICA DE RIESGO GLOBAL (OPCIONAL)
// ========================

const estudiantes = []; // para la vista de riesgo global, si la usas

function calcularRiesgo(asistencia, promedio, noEntregadas) {
    if (asistencia < 70 || promedio < 14.5 || noEntregadas >= 5) {
        return 'alto';
    } else if (asistencia < 80 || promedio < 16 || noEntregadas >= 3) {
        return 'medio';
    } else {
        return 'bajo';
    }
}

function generarSugerenciaRiesgo(nivel) {
    if (nivel === 'alto') {
        return 'Riesgo alto: programar tutoría inmediata, contactar a la familia y derivar a acompañamiento académico o psicológico.';
    }
    if (nivel === 'medio') {
        return 'Riesgo medio: reforzar contenidos clave, realizar seguimiento semanal y motivar la entrega de actividades pendientes.';
    }
    return 'Riesgo bajo: mantener seguimiento regular, reconocer avances y promover hábitos de estudio constantes.';
}

function actualizarSemaforo(nivel) {
    const luzRoja = document.getElementById('luz-roja');
    const luzAmarilla = document.getElementById('luz-amarilla');
    const luzVerde = document.getElementById('luz-verde');

    if (!luzRoja || !luzAmarilla || !luzVerde) return;

    luzRoja.className = 'luz';
    luzAmarilla.className = 'luz';
    luzVerde.className = 'luz';

    if (nivel === 'alto') {
        luzRoja.classList.add('activa', 'roja');
    } else if (nivel === 'medio') {
        luzAmarilla.classList.add('activa', 'amarilla');
    } else if (nivel === 'bajo') {
        luzVerde.classList.add('activa', 'verde');
    }
}

function actualizarTabla() {
    const tbody = document.getElementById('tabla-estudiantes');
    if (!tbody) return;

    tbody.innerHTML = '';
    estudiantes.forEach((e, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${e.nombre}</td>
            <td>${e.curso}</td>
            <td>${e.asistencia}</td>
            <td>${e.promedio}</td>
            <td>${e.noEntregadas}</td>
            <td>
                <span class="risk-badge risk-${e.nivel}">
                    ${e.nivel.toUpperCase()}
                </span>
            </td>
            <td>
                <button type="button" onclick="verEstudiante(${index})">Ver</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    actualizarKPI();
}

function actualizarKPI() {
    const kAlto = document.getElementById('kpi-alto');
    const kMedio = document.getElementById('kpi-medio');
    const kBajo = document.getElementById('kpi-bajo');
    if (!kAlto || !kMedio || !kBajo) return;

    let alto = 0, medio = 0, bajo = 0;
    estudiantes.forEach(e => {
        if (e.nivel === 'alto') alto++;
        else if (e.nivel === 'medio') medio++;
        else if (e.nivel === 'bajo') bajo++;
    });

    kAlto.textContent = alto;
    kMedio.textContent = medio;
    kBajo.textContent = bajo;
}

function verEstudiante(index) {
    const e = estudiantes[index];
    const nivelTexto = document.getElementById('nivel-riesgo-texto');
    const sug = document.getElementById('sugerencia');
    if (!nivelTexto || !sug) return;

    nivelTexto.innerHTML = '<strong>Nivel de riesgo:</strong> ' + e.nivel.toUpperCase();
    sug.textContent = generarSugerenciaRiesgo(e.nivel);
    actualizarSemaforo(e.nivel);
}

// Manejo del formulario global de riesgo, si existe
const formEstudianteGlobal = document.getElementById('form-estudiante');
if (formEstudianteGlobal) {
    formEstudianteGlobal.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const nombre = document.getElementById('nombre').value.trim();
        const curso = document.getElementById('curso').value.trim() || '-';
        const asistencia = parseFloat(document.getElementById('asistencia').value);
        const promedio = parseFloat(document.getElementById('promedio').value);
        const noEntregadas = parseInt(document.getElementById('noEntregadas').value);

        if (!nombre || isNaN(asistencia) || isNaN(promedio) || isNaN(noEntregadas)) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }

        const nivel = calcularRiesgo(asistencia, promedio, noEntregadas);

        const estudiante = { nombre, curso, asistencia, promedio, noEntregadas, nivel };
        estudiantes.push(estudiante);

        actualizarTabla();
        verEstudiante(estudiantes.length - 1);
        this.reset();
    });
}

// ========================
// 2) CHAT PARA CADA MATERIA CON n8n
// ========================

// Cambia esta URL por la URL de tu Webhook de n8n
const N8N_WEBHOOK_URL = 'https://TU_DOMINIO_N8N/webhook/tu-workflow';

async function enviarMensaje(materia) {
    const input = document.getElementById(`input-${materia}`);
    const chat = document.getElementById(`chat-${materia}`);
    if (!input || !chat) return;

    const texto = (input.value || '').trim();
    if (!texto) return;

    // Mensaje del usuario
    const pUser = document.createElement('p');
    pUser.innerHTML = `<strong>Tú:</strong> ${texto}`;
    chat.appendChild(pUser);
    chat.scrollTop = chat.scrollHeight;
    input.value = '';

    // Cédula del estudiante logueado
    const cedula = localStorage.getItem('estudiante-actual') || 'sin-cedula';
    try {
        const respuesta = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                materia: materia,
                cedula: cedula,
                mensaje: texto
            })
        });
        const data = await respuesta.json(); // adapta según tu workflow
        const textoBot = data.respuesta || 'No se recibió respuesta desde la IA.';
        const pBot = document.createElement('p');
        pBot.innerHTML = `<strong>Bot:</strong> ${textoBot}`;
        chat.appendChild(pBot);
        chat.scrollTop = chat.scrollHeight;
    } catch (err) {
        const pError = document.createElement('p');
        pError.innerHTML = '<strong>Bot:</strong> Error al conectar con el asistente. Intenta de nuevo.';
        chat.appendChild(pError);
        chat.scrollTop = chat.scrollHeight;
    }
}
// Hacer el formulario de riesgo solo de vista (read-only)
(function soloVistaRiesgo() {
  const form = document.getElementById('form-estudiante');
  if (!form) return;

  Array.from(form.elements).forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'SELECT') {
      el.disabled = true;
    }
  });
})();