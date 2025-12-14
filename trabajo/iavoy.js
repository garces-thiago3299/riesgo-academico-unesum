// Cambia esta URL por tu Webhook de n8n
const N8N_WEBHOOK_URL = 'https://TU_DOMINIO_N8N/webhook/tu-workflow';

function materiaLabel(nombre) {
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

// Inicializar etiqueta de materia en el chat
(function initIAMateria() {
  const params = new URLSearchParams(window.location.search);
  const materia = params.get('materia') || 'matematicas';
  const label = document.getElementById('ia-materia-label');
  if (label) label.textContent = materiaLabel(materia);
})();

async function enviarMensajeIA() {
  const params = new URLSearchParams(window.location.search);
  const materia = params.get('materia') || 'matematicas';

  const input = document.getElementById('input-ia-materia');
  const chat = document.getElementById('chat-ia-materia');
  if (!input || !chat) return;

  const texto = (input.value || '').trim();
  if (!texto) return;

  const pUser = document.createElement('p');
  pUser.innerHTML = `<strong>Tú:</strong> ${texto}`;
  chat.appendChild(pUser);
  chat.scrollTop = chat.scrollHeight;
  input.value = '';

  const cedula =
    localStorage.getItem('estudiante-actual') ||
    localStorage.getItem('profesor-materia') ||
    'sin-cedula';

  try {
    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materia: materia,
        cedula: cedula,
        mensaje: texto
      })
    });

    const data = await resp.json(); // adapta al formato de tu workflow
    const textoBot = data.respuesta || 'No se recibió respuesta desde la IA.';

    const pBot = document.createElement('p');
    pBot.innerHTML = `<strong>Bot:</strong> ${textoBot}`;
    chat.appendChild(pBot);
    chat.scrollTop = chat.scrollHeight;
  } catch (e) {
    const pErr = document.createElement('p');
    pErr.innerHTML = '<strong>Bot:</strong> Error al conectar con el asistente. Intenta de nuevo.';
    chat.appendChild(pErr);
    chat.scrollTop = chat.scrollHeight;
  }
}
