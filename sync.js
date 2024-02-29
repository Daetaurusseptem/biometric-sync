const axios = require("axios");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ZKJUBAER = require("zk-jubaer"); // Ajusta la ruta según sea necesario
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");



let empresaId;

const argv = yargs(hideBin(process.argv))
  .option("deviceIp", {
    alias: "ip",
    description: "La IP del dispositivo biométrico",
    type: "string",
  })
  .option("port", {
    alias: "port",
    description: "puerto del biometrico",
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

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

async function sincronizarUsuariosBiometricos(url, token, dispositivoIp, dispositivoPuerto, empresaId) {
  
  const zk = new ZKJUBAER(dispositivoIp, dispositivoPuerto, 5200, 5000);
  await zk.createSocket();

  try {
    // Obtener usuarios del dispositivo biométrico
    const biometricUsers = await zk.getUsers();
    

    // Obtener usuarios de la base de datos
    const { data: dbUsers } = await axios.get(`${url}/api/empleados/company/all/${empresaId}`);


    // Convertir dbUsers a un Map para búsqueda eficiente
    const dbUsersMap = new Map(dbUsers.empleado.map(user => [user.uidBiometrico, user]));

    // Filtrar usuarios del biométrico que no están en la base de datos
    const newUsers = biometricUsers.data.filter(user => !dbUsersMap.has(user.uid.toString()));

    // Crear los usuarios faltantes en la base de datos
    for (const newUser of newUsers) {
      await axios.post(`${url}/api/empleados`, {
        // Asegúrate de ajustar este objeto al esquema esperado por tu API
        uidBiometrico: newUser.uid,
        nombre: newUser.name,
        empresa: empresaId
      }, {
        headers: { 'x-token':token }
      });
    }

    console.log(`Sincronización completada. ${newUsers.length} usuarios nuevos creados.`);
  } catch (error) {
    console.error("Error durante la sincronización de usuarios biométricos:", error);
  } finally {
    await zk.disconnect();
  }
}

autenticar()
  .then((token) => {
    console.log("Autenticación exitosa");
    console.log(token);
    sincronizarUsuariosBiometricos('http://localhost:3000',token,argv.ip, argv.port, token.usuario.empresa);
  })
  .catch((error) => {
    console.error("Falló la autenticación", error);
  });
