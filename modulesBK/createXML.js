const { response } = require('express');
const crypto = require('crypto');
const fs = require('fs');
const xml2js = require('xml2js');
const AdmZip = require('adm-zip');
const { DateTime } = require('luxon');
const { v4: uuidv4 } = require('uuid');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const generarHashSHA384 = (data) => {
  const hash = crypto.createHash('sha384'); // Especificamos SHA-384
  hash.update(data, 'utf8'); // Actualizamos con los datos que queremos hashear
  return hash.digest('hex'); // Obtenemos el hash en formato hexadecimal
};

const createfilename = (FechaFactura, Nit, consecEnvio, init) => {
  let digitYear, hexSConsecutivo;
  digitYear = FechaFactura.slice(2, 4);
  const nit10d = Nit.toString().padStart(10, 0);
  hexSConsecutivo = consecEnvio.toString(16).padStart(8, 0);
  const nameXML = init + nit10d + '000' + digitYear + hexSConsecutivo + '.xml';
  const folderName =
    'Z' + nit10d + '000' + digitYear + hexSConsecutivo + '.zip';
  return { nameXML, folderName };
};

const actualizaSoftCode = (softCode, CUFE, typeDoc) => {
  const xmlFilePath =
    'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\xmlFiles\\DocumentParaFirma.xml';
  fs.readFile(xmlFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo el archivo:', err);
      return;
    }
    const doc = new DOMParser().parseFromString(data, 'text/xml');
    const nodeSoft = doc.getElementsByTagName('sts:SoftwareSecurityCode')[0];
    const nodeCUFE = doc.getElementsByTagName('cbc:UUID')[0];

    if (nodeCUFE && nodeSoft) {
      nodeSoft.textContent = softCode;
      nodeCUFE.textContent = CUFE;

      const updatedXML = new XMLSerializer().serializeToString(doc);

      fs.writeFile(xmlFilePath, updatedXML, 'utf8', (err) => {
        if (err) {
          console.error('Error guardando el archivo:', err);
          return;
        }
        console.log('Archivo actualizado con éxito.');
      });
    } else {
      console.log('Nodos no encontrados.');
    }
  });
};

const actualizaCUFE = (softCode, CUFE, typeDoc) => {
  // Ruta al archivo XML
  const xmlFilePath =
    'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\xmlFiles\\DocumentParaFirma.xml';

  fs.readFile(xmlFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo el archivo:', err);
      return;
    }
    // Parsear XML a JSON
    const parser = new xml2js.Parser();
    parser.parseString(data, (err, result) => {
      if (err) {
        console.error('Error parseando el XML:', err);
        return;
      }

      // Actualizar el valor de un nodo
      result[typeDoc]['cbc:UUID'][0]._ = CUFE;
      result[typeDoc]['ext:UBLExtensions'][0]['ext:UBLExtension'][0][
        'ext:ExtensionContent'
      ][0]['sts:DianExtensions'][0]['sts:SoftwareSecurityCode'][0]._ = softCode;

      // Convertir el JSON de nuevo a XML
      const builder = new xml2js.Builder();
      const updatedXML = builder.buildObject(result);

      // Guardar el XML actualizado en el archivo
      fs.writeFile(
        'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\xmlFiles\\updatedSinFirma.xml',
        updatedXML,
        (err) => {
          if (err) {
            console.error('Error escribiendo el archivo:', err);
            return;
          }
        }
      );
    });
  });
};

function preparePem(pem) {
  return (
    pem
      // remove BEGIN/END
      .replace(/-----(BEGIN|END)[\w\d\s]+-----/g, '')
      // remove \r, \n
      .replace(/[\r\n]/g, '')
  );
}

function pem2der(pem) {
  pem = preparePem(pem);
  // convert base64 to ArrayBuffer
  const binBuffer = new Uint8Array(Buffer.from(pem, 'base64')).buffer;
  return binBuffer;
}

const crearZIPadm = async (signed, nameXML, folderName) => {
  const outputPath =
    'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\zips\\' + folderName;

  const zip = new AdmZip();
  zip.addFile(nameXML, signed);
  await zip.writeZip(outputPath);

  fs.readFile(outputPath, (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      return;
    }
    // Convertir el contenido del archivo a Base64
    const contenidoBase64 = data.toString('base64');
    // Guardar el contenido Base64 en un nuevo archivo
    const rutaSalida = 'archivo_base64.txt';
    fs.writeFile(rutaSalida, contenidoBase64, (err) => {
      if (err) {
        console.error('Error al guardar el archivo Base64:', err);
        return;
      }
    });
  });
};

//fecha en formato isostring
const changeDateFormat = () => {
  const date = DateTime.now()
    .setZone('America/Bogota') // Cambia a tu zona horaria deseada
    .toISO({ includeOffset: true }); // Incluye el desplazamiento de zona horaria

  return date;
};

const GenerarSOAP = (fileName) => {
  const createdTime = changeDateFormat();
  const expiresTime = dateTime
    .plus({ minutes: 1 })
    .toISO({ includeOffset: true });

  const xmlRequest = `
  <soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope'
   xmlns:wcf='http://wcf.dian.colombia'>
   <soap:Header xmlns:wsa='http://www.w3.org/2005/08/addressing'>
      <wsse:Security xmlns:wsse='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd'
         xmlns:wsu='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd'>
         <wsu:Timestamp wsu:Id='TS-${uuidv4()}'>
            <wsu:Created>${createdTime}</wsu:Created>
            <wsu:Expires>${expiresTime}</wsu:Expires>
         </wsu:Timestamp>
         <wsse:BinarySecurityToken EncodingType='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary' ValueType='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3' wsu:Id='X509-D7E58FC978C51534DE17347929768351'>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</wsse:BinarySecurityToken>
         <ds:Signature Id='SIG-${uuidv4()}'
            xmlns:ds='http://www.w3.org/2000/09/xmldsig#'>
            <ds:SignedInfo>
               <ds:CanonicalizationMethod Algorithm='http://www.w3.org/2001/10/xml-exc-c14n#'>
                  <ec:InclusiveNamespaces PrefixList='wsa soap wcf'
                     xmlns:ec='http://www.w3.org/2001/10/xml-exc-c14n#'/>
               </ds:CanonicalizationMethod>
               <ds:SignatureMethod Algorithm='http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'/>
               <ds:Reference URI='#id-${uuidv4()}'>
                  <ds:Transforms>
                     <ds:Transform Algorithm='http://www.w3.org/2001/10/xml-exc-c14n#'>
                        <ec:InclusiveNamespaces PrefixList='soap wcf'
                           xmlns:ec='http://www.w3.org/2001/10/xml-exc-c14n#'/>
                     </ds:Transform>
                  </ds:Transforms>
                  <ds:DigestMethod Algorithm='http://www.w3.org/2001/04/xmlenc#sha256'/>
                  <ds:DigestValue>Dd49+9Se7FJp9JRPsrpL1pYtn2LTdQSQN9rYhoEXV+E=</ds:DigestValue>
               </ds:Reference>
            </ds:SignedInfo>
            <ds:SignatureValue>r1BluHojB5gfaLWowk93/wTmM3440+OoM+QXOTJxmmezfv4n+FHtrboJyY5iah9s3RToQUBlJUcv&#13; uBGlYjGkfvDCs7PigTcC1laEIl1IpHHRZ+UgWR3U7eZHiNucBP8Jm5U9a53pUtliMxLhSfKVbqtp&#13; /ZxExLPClmxKoTdxsN3FXaImBiIeK1fHujLDyTYPtk926CYETwszcQyqTAVoQBfa6s9ME7cxLtVo&#13; SCmIf5iPIIMWZrD4b9KrD3rgF8NKIru5a3j8n1zeM6l2XG8AOygFT5lC7kGXGDQmxh+J//z2Rhri&#13; CViwiBwcWWboJSLdy/yMPLcM5Hcw9B7zJvhDpA==</ds:SignatureValue>
            <ds:KeyInfo Id='KI-${uuidv4()}'>
               <wsse:SecurityTokenReference wsu:Id='STR-${uuidv4()}'>
                  <wsse:Reference URI='#X509-${uuidv4()}' ValueType='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3'/>
               </wsse:SecurityTokenReference>
            </ds:KeyInfo>
         </ds:Signature>
      </wsse:Security>
      <wsa:Action>http://wcf.dian.colombia/IWcfDianCustomerServices/SendTestSetAsync</wsa:Action>
      <wsa:To wsu:Id='id-${uuidv4()}'
         xmlns:wsu='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd'>https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc</wsa:To>
   </soap:Header>
   <soap:Body>
      <wcf:SendTestSetAsync>
         <!--Optional:-->
         <wcf:fileName>${fileName}</wcf:fileName>
         <!--Optional:-->
         <wcf:contentFile>${contentFile}</wcf:contentFile>
         <wcf:testSetId>d2405818-ea23-4042-8bb9-d05F6e8892e2</wcf:testSetId>
  `;
};

module.exports = {
  generarHashSHA384,
  createfilename,
  actualizaSoftCode,
  actualizaCUFE,
  preparePem,
  pem2der,
  changeDateFormat,
  crearZIPadm,
  GenerarSOAP,
};
