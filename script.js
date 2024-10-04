// Cargar la información de asistencia desde localStorage al cargar la página
window.addEventListener('load', () => {
    const asistenciaGuardada = localStorage.getItem('asistencia');
    if (asistenciaGuardada) {
        baseDatos = JSON.parse(asistenciaGuardada);
    }
});

let baseDatos = {};

// Cargar la base de datos desde el archivo JSON
fetch('database.json')
    .then(response => response.json())
    .then(data => {
        baseDatos = data; // Asignar los datos cargados a la variable baseDatos
    })
    .catch(error => {
        console.error('Error al cargar la base de datos:', error);
    });

// Función para validar el formato del RUT
function validarRUT(rut) {
    const regex = /^\d{7,8}-[kK\d]$/; // Formato básico de RUT: 12345678-9
    return regex.test(rut);
}

// Función para llenar checkboxes de acompañantes
function llenarAcompañantes(acompañantes) {
    const checkboxesContainer = document.getElementById('accompanistsCheckboxes');
    checkboxesContainer.innerHTML = ''; // Resetear los checkboxes

    acompañantes.forEach(acompañante => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = acompañante;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${acompañante}`));
        checkboxesContainer.appendChild(label);
    });

    // Mostrar el contenedor de acompañantes si hay al menos uno
    if (acompañantes.length > 0) {
        document.getElementById('accompanistsCheckboxes').classList.remove('hidden');
    } else {
        document.getElementById('accompanistsCheckboxes').classList.add('hidden');
    }
}

// Verificación del RUT al hacer clic en el botón o al presionar Enter
function verificarRUT() {
    const rut = document.getElementById('rut').value;
    const errorElement = document.getElementById('error');
    const userInfo = document.getElementById('userInfo');
    const confirmBtn = document.getElementById('confirmBtn');
    const nombreElement = document.getElementById('nombre');
    const titularName = document.getElementById('titularName');
    const attendanceSelection = document.getElementById('attendanceSelection');
    const titularCheckbox = document.getElementById('titularCheckbox');
    const noAsistireCheckbox = document.getElementById('noAsistireCheckbox');

    // Validar el formato del RUT
    if (!validarRUT(rut)) {
        errorElement.textContent = 'RUT no válido. Inténtelo de nuevo.';
        userInfo.classList.add('hidden');
        return;
    } else {
        errorElement.textContent = ''; // Limpiar error si es válido
    }

    // Verificar si el RUT está en la base de datos
    const usuario = baseDatos[rut];

    if (usuario) {
        if (usuario.confirmado) {
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
}

// Detectar cuando se presiona Enter en el campo de texto del RUT
document.getElementById('rut').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evitar que el formulario se envíe si es que tiene un submit
        verificarRUT(); // Llamar a la función de verificación del RUT
    }
});

// Verificar RUT al hacer clic en el botón
document.getElementById('checkRutBtn').addEventListener('click', verificarRUT);

document.getElementById('noAsistireCheckbox').addEventListener('change', function () {
    const titularCheckbox = document.getElementById('titularCheckbox');
    const checkboxes = document.querySelectorAll('#accompanistsCheckboxes input[type="checkbox"]');

    if (this.checked) {
        // Deshabilitar las otras opciones si "No asistiré" está seleccionado
        titularCheckbox.disabled = true;
        checkboxes.forEach(checkbox => checkbox.disabled = true);
    } else {
        // Habilitar las opciones nuevamente si se deselecciona "No asistiré"
        titularCheckbox.disabled = false;
        checkboxes.forEach(checkbox => checkbox.disabled = false);
    }
});

// Confirmar asistencia
document.getElementById('confirmBtn').addEventListener('click', function () {
    const rut = document.getElementById('rut').value;
    const titularCheckbox = document.getElementById('titularCheckbox');
    const checkboxes = document.querySelectorAll('#accompanistsCheckboxes input[type="checkbox"]');
    const noAsistireCheckbox = document.getElementById('noAsistireCheckbox');
    let asistentes = [];

    if (noAsistireCheckbox.checked) {
        // Mensaje para el caso de "No asistiré"
        const mensaje = `¡Información registrada, gracias!`;
        document.getElementById('confirmMessage').textContent = mensaje;
        document.getElementById('confirmMessage').classList.remove('hidden');
        document.getElementById('confirmBtn').classList.add('hidden');
        
        // Marcar RUT como confirmado en la base de datos
        baseDatos[rut].confirmado = true;
        guardarAsistencia(rut); // Guardar información en localStorage
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

            // Marcar RUT como confirmado en la base de datos
            baseDatos[rut].confirmado = true;
            guardarAsistencia(rut); // Guardar información en localStorage
        } else {
            document.getElementById('confirmMessage').textContent = 'Debe seleccionar al menos un asistente.';
            document.getElementById('confirmMessage').classList.remove('hidden');
        }
    }
});

// Función para guardar la información de asistencia en localStorage
function guardarAsistencia(rut) {
    // Convertir la base de datos a formato JSON y guardarla en localStorage
    localStorage.setItem('asistencia', JSON.stringify(baseDatos));
}
