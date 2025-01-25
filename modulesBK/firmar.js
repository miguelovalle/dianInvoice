const fs = require('fs');
var { Crypto } = require('@peculiar/webcrypto');
const xadesjs = require('xadesjs');
const { XMLSerializer } = require('@xmldom/xmldom');
const { v4: uuidv4 } = require('uuid');
const { preparePem, pem2der } = require('./createXML');
const forge = require('node-forge');
const { generarSigningCertificates } = require('./signFn');
const crypto = new Crypto();

xadesjs.Application.setEngine('NodeJS', new Crypto());

//const idForDocument = `xmldsig-${uuidv4()}`;
const idForSignature = `xmldsig-${uuidv4()}`;
const idForKeyInfo = `xmldsig-${uuidv4()}-keyinfo`;
const idForSignatureValue = `${idForSignature}-sigvalue`;
const idForSignedProperties = `${idForSignature}-signedprops`;
const alg = {
  name: 'RSASSA-PKCS1-v1_5',
  hash: 'sha-384',
};

const certs = generarSigningCertificates();

const signfile = async (nameXML, dateFormated) => {
  try {
    console.log('entrada signfile', nameXML, dateFormated);
    //x509certs = await obtenerCadenaCerts();
    const certPem = fs.readFileSync('./andes/certificate.pem', {
      encoding: 'utf8',
    });

    // Read private key
    const keyPem = fs.readFileSync('./andes/private_key.pem', {
      encoding: 'utf8',
    });
    const keyDer = pem2der(keyPem);
    const key = await crypto.subtle.importKey('pkcs8', keyDer, alg, true, [
      'sign',
    ]);

    // read public key
    const publicPem = fs.readFileSync('./andes/public_key.pem', {
      encoding: 'utf8',
    });
    const publicDer = pem2der(publicPem);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicDer,
      alg,
      true,
      ['verify']
    );

    // Read document
    var xmlString = await fs.readFileSync(
      'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\xmlFiles\\updatedSinFirma.xml',
      'utf-8'
    );

    var xml = xadesjs.Parse(xmlString);

    var xadesXml = new xadesjs.SignedXml();

    xadesXml.XmlSignature.KeyInfo.Id = idForKeyInfo;
    xadesXml.SignedProperties.Id = idForSignedProperties;

    const x509 = preparePem(certPem);

    const signature = await xadesXml.Sign(
      alg, // algorithm
      key, // key
      xml, // document
      {
        // options
        id: idForSignature,

        keyvalue: publicKey,

        x509: [x509],

        references: [
          {
            id: `${idForSignature}-ref0`,
            uri: '',
            hash: 'sha-384',
            transforms: ['enveloped'],
          },
          {
            uri: `#${idForKeyInfo}`,
            hash: 'sha-384',
          },
        ],
        signingCertificate: x509,
        signingTime: {
          format: 'isoDateTime',
          value: dateFormated,
        },
        policy: {
          hash: 'sha-384',
          identifier: {
            value:
              'https://facturaelectronica.dian.gov.co/politicadefirma/v1/politicadefirmav2.pdf',
          },
        },
        signerRole: { claimed: ['supplier'] },
      }
    );
    // obtener el xml de la firma
    const nodeSign = signature.GetXml();

    let signedXmlString = new XMLSerializer().serializeToString(
      xadesXml.XmlSignature.GetXml()
    );
    // Modificar el XML para agregar los otros certificados
    const parser = new DOMParser();

    const doc = parser.parseFromString(signedXmlString, 'application/xml');

    // Ubicar el elemento <SigningCertificate>
    let signingCertElement = doc.getElementsByTagName(
      'xades:SigningCertificate'
    )[0];

    // Agregar los certificados adicionales
    certs.slice(1).forEach((cert) => {
      const certElement = doc.createElement('Cert');
      const certDigestElement = doc.createElement('CertDigest');
      const digestMethodElement = doc.createElement('DigestMethod');

      digestMethodElement.setAttribute(
        'Algorithm',
        'http://www.w3.org/2001/04/xmlenc#sha256'
      );

      const digestValueElement = doc.createElement('DigestValue');
      digestValueElement.textContent = cert.digest;

      certDigestElement.appendChild(digestMethodElement);
      certDigestElement.appendChild(digestValueElement);

      const issuerSerialElement = doc.createElement('IssuerSerial');
      const issuerNameElement = doc.createElement('X509IssuerName');
      issuerNameElement.textContent = cert.issuerName;
      const serialNumberElement = doc.createElement('X509SerialNumber');
      serialNumberElement.textContent = cert.serialNumber;

      issuerSerialElement.appendChild(issuerNameElement);
      issuerSerialElement.appendChild(serialNumberElement);

      certElement.appendChild(certDigestElement);
      certElement.appendChild(issuerSerialElement);

      signingCertElement.appendChild(certElement);
    });

    // Asignar el ID a SignatureValue

    nodeSign
      .getElementsByTagName('ds:SignatureValue')[0]
      .setAttribute('Id', idForSignatureValue);

    nodeSign
      .getElementsByTagName('xades:QualifyingProperties')[0]
      .setAttribute('Target', `#${idForSignature}`);

    // Obtener el segundo nodo /ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent
    const ublExtensions = xml.getElementsByTagName('ext:UBLExtension')[1]; // Obtener el segundo UBLExtension
    const extensionContent = xml.getElementsByTagName(
      'ext:ExtensionContent'
    )[1]; // Obtener el nodo ExtensionContent

    extensionContent.appendChild(nodeSign);

    // serialize XML
    const oSerializer = new XMLSerializer();
    const sXML = oSerializer.serializeToString(xml);
    await fs.writeFileSync(`./xmlFiles/${nameXML}`, sXML, 'utf-8');

    console.log('documento guardado' + `./xmlFiles/${nameXML}`);
    return sXML;
  } catch (error) {
    console.error('Error al firmar el archivo:', error);
  }
};
module.exports = { signfile };
