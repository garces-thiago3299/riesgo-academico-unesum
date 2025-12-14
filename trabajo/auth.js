// NUEVAS CLAVES PARA PROFESOR
const STORAGE_KEY_PROF_ROLE = 'profesor-materia';
const STORAGE_KEY_ROL = 'rol-actual';

// Guardar rol y materia de profesor
function setProfesorMateria(materia) {
    localStorage.setItem(STORAGE_KEY_PROF_ROLE, materia);
    localStorage.setItem(STORAGE_KEY_ROL, 'profesor');
}

function clearSesionTotal() {
    localStorage.removeItem(STORAGE_KEY_SESSION);     // estudiante
    localStorage.removeItem(STORAGE_KEY_PROF_ROLE);   // profesor
    localStorage.removeItem(STORAGE_KEY_ROL);
}
// LOGIN DE PROFESOR
const formLoginProfesor = document.getElementById('form-login-profesor');
if (formLoginProfesor) {
    formLoginProfesor.addEventListener('submit', function (e) {
        e.preventDefault();
        const user = document.getElementById('prof-user').value.trim().toLowerCase();
        const pass = document.getElementById('prof-pass').value;

        // usuarios fijos por materia
        const materiasValidas = ['matematicas', 'lenguaje', 'ingles', 'programacion', 'sistemaweb'];

        if (!materiasValidas.includes(user) || user !== pass) {
            alert('Usuario o contraseña de profesor incorrectos.');
            return;
        }

        setProfesorMateria(user);
        alert('Bienvenido/a, profesor de ' + user);
        window.location.href = 'index.html'; // usa el mismo panel de materias
    });
}


// Claves de almacenamiento
const STORAGE_KEY_USERS = 'estudiantes-registrados';
const STORAGE_KEY_SESSION = 'estudiante-actual';

// Obtener y guardar usuarios
function getUsuarios() {
    const data = localStorage.getItem(STORAGE_KEY_USERS);
    return data ? JSON.parse(data) : [];
}

function saveUsuarios(usuarios) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(usuarios));
}

// Manejo de sesión
function setSesion(cedula) {
    localStorage.setItem(STORAGE_KEY_SESSION, cedula);
}
function getSesion() {
    return localStorage.getItem(STORAGE_KEY_SESSION);
}

// REGISTRO
const formRegistro = document.getElementById('form-registro');
if (formRegistro) {
    formRegistro.addEventListener('submit', function (e) {
        e.preventDefault();
        const cedula = document.getElementById('cedula-reg').value.trim();
        const nombre = document.getElementById('nombre-reg').value.trim();
        const pass = document.getElementById('pass-reg').value;

        if (!cedula || !nombre || !pass) {
            alert('Completa todos los campos.');
            return;
        }

        const usuarios = getUsuarios();
        const existe = usuarios.find(u => u.cedula === cedula);
        if (existe) {
            alert('Ya existe un estudiante registrado con esa cédula.');
            return;
        }

        usuarios.push({ cedula, nombre, pass });
        saveUsuarios(usuarios);
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        window.location.href = 'login.html';
    });
}

// LOGIN
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', function (e) {
        e.preventDefault();
        const cedula = document.getElementById('cedula-login').value.trim();
        const pass = document.getElementById('pass-login').value;

        const usuarios = getUsuarios();
        const usuario = usuarios.find(u => u.cedula === cedula && u.pass === pass);

        if (!usuario) {
            alert('Cédula o contraseña incorrecta.');
            return;
        }

        setSesion(usuario.cedula);
        alert('Inicio de sesión correcto. Bienvenido/a, ' + usuario.nombre);
        window.location.href = 'index.html';
    });
}
