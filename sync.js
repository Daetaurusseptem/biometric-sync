const axios = require('axios');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const ZKJUBAER = require('zk-jubaer'); // Ajusta la ruta según sea necesario
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).option('deviceIp', {
    alias: 'd',
    description: 'La IP del dispositivo biométrico',
    type: 'string',
}).option('empresaId', {
    alias: 'e',
    description: 'El ID de la empresa',
    type: 'string',
}).help().alias('help', 'h').argv;

async function autenticar() {
    return new Promise((resolve, reject) => {
        readline.question('Username: ', (username) => {
            readline.question('Password: ', async (password) => {
                try {
                    const response = await axios.post('http://localhost:3000/auth', {
                        username,
                        password
                    });
                    resolve(response.data); // Asumiendo que la API responde con algún tipo de token de acceso
                } catch (error) {
                    console.error('Error de autenticación:', error);
                    reject(error);
                } finally {
                    readline.close();
                }
            });
        });
    });
}

async function sincronizarDatosBiometricos(token) {
    const { deviceIp, empresaId } = argv;
    console.log(deviceIp, empresaId);
    let zk = new ZKJUBAER(deviceIp, 4370, 5200, 5000);

    try {
        await zk.createSocket();
    } catch (error) {
        console.log(error);
    }

    try {
        const users = await zk.getUsers();
        console.log("Usuarios obtenidos del dispositivo biométrico:", users);

        for (const user of users.data) {
            const { uid, name, role, userId } = user;
            let empleado = await Empleado.findOne({ userId });
            if (!empleado) {
                empleado = new Empleado({
                    uidBiometrico: userId,
                    nombre: name,
                    role: role,
                    sincronizadoBiometrico: true,
                    empresa: empresaId
                });
                await empleado.save();
            } else {
                await Empleado.findByIdAndUpdate(empleado._id, {
                    nombre: name,
                    role: role,
                    userIdBiometrico: userId,
                    sincronizadoBiometrico: true
                });
            }
        }
        await zk.disconnect();
        console.log('Sincronización de empleados completa');
    } catch (error) {
        console.error("Error al sincronizar datos con el dispositivo biométrico:", error);
        await zk.disconnect();
    }
}

autenticar().then(token => {
    console.log('Autenticación exitosa');
    sincronizarDatosBiometricos(token);
}).catch(error => {
    console.error('Falló la autenticación', error);
});
