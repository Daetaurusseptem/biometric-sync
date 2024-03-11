const dayjs = require('dayjs');

const date = "Thu Mar 07 2024 17:15:46 GMT-0600";
const formattedDate = dayjs(date).format('YYYY-MM-DDTHH:mm:ssZ');

console.log(formattedDate); // Salida en formato ISO 8601