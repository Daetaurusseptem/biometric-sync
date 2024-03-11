const cron = require("node-cron");

const axios = require("axios");

const ZKJUBAER = require("zk-jubaer");

const dayjs = require('dayjs');



const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const yargs = require("yargs/yargs");

const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
.option("deviceIp", {
    alias: "ip",
    demandOption:true,
    description: "La IP del dispositivo biométrico",
    type: "string",
  })
  .option("port", {
    alias: "port",
    demandOption:true,
    description: "puerto del biometrico",
    type: "string",
  })
  // .option("dump hour", {
  //   alias: "port",
  //   demandOption:true,
  //   description: "hora de translacion de asistencias al sistema formato: ['hora','minutos']",
  //   type: "array",
  // })
  .help()
  .alias("help", "h").argv;

// Configuración del dispositivo biométrico
const BIOMETRIC_DEVICE_IP = argv.ip;
const BIOMETRIC_DEVICE_PORT = argv.port;                

// URL del endpoint del backend para enviar las asistencias
const BACKEND_URL = "http://localhost:3000/api/sync";

// Función para obtener las asistencias del dispositivo biométrico
async function obtenerAsistencias() {
  let zk = new ZKJUBAER(BIOMETRIC_DEVICE_IP, BIOMETRIC_DEVICE_PORT, 10000, 4000);
  try {
    await zk.createSocket();
    let attendancesinfo = await zk.getAttendanceSize();
    console.log(attendancesinfo);
    if(attendancesinfo>0){
      let attendances = await zk.getAttendances();
      let attendancesDelete = await zk.clearAttendanceLog();
      console.log(attendances);
      const attendancesFormat =  attendances.data.map((att) => ({
        deviceUserId: att.deviceUserId         ,
        tiempoRegistro: new Date(dayjs(att.recordTime).format('YYYY-MM-DDTHH:mm:ssZ'))  
      }));
      console.log(attendancesFormat);
      return attendancesFormat
    }
    await zk.disconnect();
    
  } catch (error) {
    console.error(
      "Error al obtener asistencias del dispositivo biométrico:",
      error
    );
    console.log(attendances.data);
    return attendances.data;
  }
} 

// Función para enviar asistencias al backend
async function enviarAsistencias(asistencias, _empresaId) {
  try {
   
    const response = await axios.post(`${BACKEND_URL}/sincronizar-asistencias/${_empresaId}`, {
      asistencias
    });
    console.log("Respuesta del backend:", response.data);
  } catch (error) {
    console.error("Error al enviar asistencias al backend:", error);
  }
}

async function autenticar() {
  return new Promise((resolve, reject) => {
    readline.question("Username: ", (username) => {
      readline.question("Password: ", async (password) => {
        try {
          const response = await axios.post("http://localhost:3000/api/auth", {
            username,
            password,
          });
          console.log(response);
          empresaId = response.data.usuario.empresa;

          resolve(response.data); // Asumiendo que la API responde con algún tipo de token de acceso
        } catch (error) {
          console.error("Error de autenticación:", error);
          reject(error);
        } finally {

          readline.close();

        }
      });
    });
  });
}
autenticar()
  .then((token) => {
    
    console.log("Autenticación exitosa");
    console.log(token.token);
    

    // Tarea cron para ejecutar a las 23:59 todos los días
    cron.schedule(
      "* 15 * * *",
      async () => {
        console.log("Ejecutando tarea para sincronizar asistencias...");
        const asistencias = await obtenerAsistencias();
        console.log(asistencias);
        if (asistencias===undefined ) {
          console.log("No hay asistencias para sincronizar.");
        }
        if (asistencias.length > 0 ) {
          await enviarAsistencias(asistencias, empresaId);
        } else {
          console.log("No hay asistencias para sincronizar.");
        }
      },
      {
        scheduled: true,
        timezone: "America/Mexico_City",
      }
    );
  })
  .catch((error) => {
    console.error("Falló la autenticación", error);
  });

