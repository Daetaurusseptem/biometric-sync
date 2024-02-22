const ZKLib = require('node-zklib'); 
const axios = require('axios');

async function startBiometricDaemon() {
    let zkInstance = new ZKLib('192.168.1.201', 4370, 5200, 5000);
    try {
        await zkInstance.createSocket();
        await zkInstance.enableDevice();
        // Escucha registros en tiempo real

        await zkInstance.getRealTimeLogs(async (data) => {
          console.log(data);
            console.log('Registro biométrico recibido:', {
              empleado:data.userId,
              fechaHora:data.attTime,
              tipo:'asistencia biometrico',
              detalles:'checado biometrico'
            });
            // Envía el registro al servidor Express
            await axios.post('http://localhost:3000/api/sync/sincronizar-asistencia/65b7e23b500d6a5df556c0c5', {
              empleado:data.userId,
              fechaHora:data.attTime,
              tipo:'asistencia',
              detalles:'checado biometrico'
            });
        });

    } catch (error) {
        console.error(error);
    }
}

startBiometricDaemon();
