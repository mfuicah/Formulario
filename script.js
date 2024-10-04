const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwvOwTIphWWCZguafzvYKgMD2VQg9A8a9pJSSucQMD6_8mf-hdF39XfUw1vTHQ_qzC7/exec';

// Función para obtener datos de Google Sheets
async function obtenerDatos(rut) {
    const response = await fetch(`${SHEET_URL}?action=get&rut=${rut}`);
    if (!response.ok) throw new Error('Error al obtener datos');
    return await response.json();
}

// Función para actualizar datos de Google Sheets
async function actualizarDatos(rut, nombre, confirmacion, acompañantes) {
    const response = await fetch(SHEET_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'update',
            rut,
            nombre,
            confirmacion,
            acompañantes: acompañantes.join(','),
        }),
    });

    if (!response.ok) throw new Error('Error al actualizar datos');
    return await response.json();
}

// Reemplazar la lógica de verificación del RUT
async function verificarRUT() {
    const rut = document.getElementById('rut').value;
    const errorElement = document.getElementById('error');
    const userInfo = document.getElementById('userInfo');
    const confirmBtn = document.getElementById('confirmBtn');
    const nombreElement = document.getElementById('nombre');
    const titularName = document.getElementById('titularName');
    const attendanceSelection = document.getElementById('attendanceSelection');
    const titularCheckbox = document.getElementById('titularCheckbox');
    const noAsistireCheckbox = document.getElementById('noAsistireCheckbox');

    if (!validarRUT(rut)) {
        errorElement.textContent = 'RUT no válido. Inténtelo de nuevo.';
        userInfo.classList.add('hidden');
        return;
    } else {
        errorElement.textContent = ''; // Limpiar error si es válido
    }

    try {
        const usuario = await obtenerDatos(rut);

        if (usuario) {
            if (usuario.confirmacion) {
                errorElement.textContent = 'La asistencia ya ha sido confirmada para este RUT.';
                userInfo.classList.add('hidden');
                return;
            }

            nombreElement.textContent = usuario.nombre;
            titularName.textContent = usuario.nombre; // Mostrar el nombre del titular
            titularCheckbox.checked = false; // Deseleccionar titular por defecto
            llenarAcompañantes(usuario.acompañantes);
            userInfo.classList.remove('hidden');
            confirmBtn.classList.remove('hidden');
            attendanceSelection.classList.remove('hidden');
        } else {
            errorElement.textContent = 'RUT no encontrado en la base de datos.';
            userInfo.classList.add('hidden');
        }

        // Reiniciar la opción de "No asistiré"
        noAsistireCheckbox.checked = false;
    } catch (error) {
        console.error('Error al verificar RUT:', error);
        errorElement.textContent = 'Error en la conexión a la base de datos.';
        userInfo.classList.add('hidden');
    }
}

// Actualizar la función de confirmación de asistencia
document.getElementById('confirmBtn').addEventListener('click', async function () {
    const rut = document.getElementById('rut').value;
    const titularCheckbox = document.getElementById('titularCheckbox');
    const checkboxes = document.querySelectorAll('#accompanistsCheckboxes input[type="checkbox"]');
    const noAsistireCheckbox = document.getElementById('noAsistireCheckbox');
    let asistentes = [];

    if (noAsistireCheckbox.checked) {
        const mensaje = `¡Información registrada, gracias!`;
        document.getElementById('confirmMessage').textContent = mensaje;
        document.getElementById('confirmMessage').classList.remove('hidden');
        document.getElementById('confirmBtn').classList.add('hidden');

        // Actualizar Google Sheets
        await actualizarDatos(rut, '', true, []); // Guardar confirmación
    } else {
        if (titularCheckbox.checked) {
            const titularName = document.getElementById('titularName').textContent;
            asistentes.push(titularName);
        }

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                asistentes.push(checkbox.value);
            }
        });

        if (asistentes.length > 0) {
            const mensaje = `¡Asistencia confirmada para: ${asistentes.join(', ')}!`;
            document.getElementById('confirmMessage').textContent = mensaje;
            document.getElementById('confirmMessage').classList.remove('hidden');
            document.getElementById('confirmBtn').classList.add('hidden');

            // Actualizar Google Sheets
            await actualizarDatos(rut, document.getElementById('titularName').textContent, true, asistentes);
        } else {
            document.getElementById('confirmMessage').textContent = 'Debe seleccionar al menos un asistente.';
            document.getElementById('confirmMessage').classList.remove('hidden');
        }
    }
});
