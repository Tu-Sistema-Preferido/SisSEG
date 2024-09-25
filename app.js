const videoElement = document.getElementById('videoElement');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadLink = document.getElementById('downloadLink');
const cameraSelect = document.getElementById('cameraSelect');

let mediaRecorder;
let recordedChunks = [];
let currentStream = null;

// Función para obtener todas las cámaras disponibles
function getCameras() {
    return navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        cameraSelect.innerHTML = ''; // Limpiamos el select antes de agregar cámaras

        // Mostrar todas las cámaras disponibles en el selector
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Cámara ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        // Iniciar con la primera cámara de la lista si hay alguna
        if (videoDevices.length > 0) {
            startCamera(videoDevices[0].deviceId);
        }
    }).catch(error => {
        console.error('Error al obtener los dispositivos:', error);
    });
}

// Función para cambiar la cámara
function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop()); // Detenemos el stream actual
    }

    navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined
        },
        audio: true // Incluimos el audio
    })
    .then(stream => {
        currentStream = stream;
        videoElement.srcObject = stream;

        mediaRecorder = new MediaRecorder(stream);

        // Limpiar datos previos al empezar la grabación
        mediaRecorder.onstart = () => {
            recordedChunks = [];
        };

        // Almacenar los fragmentos grabados
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // Crear un archivo descargable al detener la grabación
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, {
                type: 'video/mp4' // Cambiado a MP4
            });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = 'grabacion.mp4'; // Guardar como .mp4
            downloadLink.style.display = 'block';
        };
    })
    .catch(error => {
        console.error('Error al acceder a la cámara o al micrófono:', error);
    });
}

// Obtener cámaras al cargar la página
getCameras();

// Iniciar la cámara seleccionada al cambiar la selección en el select
cameraSelect.addEventListener('change', () => {
    const selectedDeviceId = cameraSelect.value;
    startCamera(selectedDeviceId);
});

// Iniciar la grabación
startBtn.addEventListener('click', () => {
    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    downloadLink.style.display = 'none';
});

// Detener la grabación
stopBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
});

// Cargar las cámaras al iniciar
window.onload = () => {
    getCameras().then(() => {
        if (cameraSelect.options.length > 0) {
            startCamera(cameraSelect.value);
        }
    });
};
