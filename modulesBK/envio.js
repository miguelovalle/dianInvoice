

const { plantilla } = require('../xmlFiles/plantillaSobre');


// URL del servicio web de la DIAN
const url = 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc';

// Configuración de los encabezados HTTP
const headers = {
  'Content-Type': 'text/xml; charset=utf-8',
  'SOAPAction': 'your-soap-action', // Reemplaza con la acción SOAP específica si es necesaria
  // Otros encabezados necesarios
};

// Función para enviar la solicitud
async function sendSoapRequest() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: plantilla,
    });

    if (response.ok) {
      const responseText = await response.text();
      console.log('Respuesta del servidor:', responseText);
      // Procesa la respuesta según sea necesario
    } else {
      console.error('Error en la solicitud:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error en la comunicación:', error);
  }
}

// Llamada a la función para enviar la solicitud


module.exports = { sendSoapRequest };
// Ejecutar la función
