const fs = require('fs');
const { XAdES, XmlDSigJs } = require('xadesjs');
const forge = require('node-forge');
const { v4: uuidv4 } = require('uuid');
const xadesjs = require('xadesjs');
const { preparePem, pem2der } = require('./createXML');

// Cargar el archivo PFX
const signfile = async (nameXML, date) => {
  const idForSignature = `xmldsig-${uuidv4()}`;
  const idForKeyInfo = `xmldsig-${uuidv4()}-keyinfo`;
  const idForSignatureValue = `${idForSignature}-sigvalue`;
  const idForSignedProperties = `${idForSignature}-signedprops`;

  // Read cert
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
  

  const pfxBuffer = fs.readFileSync('./andes/certificado.pfx');
  const password = '9Ep3KxPRph';

  // Extraer certificados de la cadena
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  // Obtener los certificados
  const certs = [];
  p12.safeContents.forEach((safeContent) => {
    safeContent.safeBags.forEach((safeBag) => {
      if (safeBag.cert) {
        const certPem = forge.pki.certificateToPem(safeBag.cert);
        certs.push(certPem);
      }
    });
  });
  // Read document
  var xmlString = await fs.readFileSync(
    'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\xmlFiles\\updatedSinFirma.xml',
    'utf-8'
  );
  var xml = xadesjs.Parse(xmlString);
  
  // Crear firma XAdES
//  const xml = new XmlDSigJs.XmlDocument();
  //xml.loadXml(xmlString);

  const signer = new XAdES.SignedXml();
  // signer.XmlSignatureObject.signaturevalue.Id = idForSignatureValue;
  //signer.XmlSignatureObject.keyinfo.Id = idForKeyInfo;
  // signer.XmlSignatureObject.QualifyingProperties.SignedProperties.Id =
  //   idForSignedProperties;

  const signature = await signer.Sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'sha-384' }, // Algoritmo de firma
     key, // Clave privada
      xml, // Documento XML
    {
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
    }
  );
  console.log("control flujo")
 
  // Modificar <SigningCertificate>
  // const signingCertificate =
  //   signer.XmlSignatureObject.QualifyingProperties.SignedProperties
  //     .SignedSignatureProperties.SigningCertificate;

  // // Agregar todos los certificados
  // certs.forEach((certPem) => {
  //   const cert = forge.pki.certificateFromPem(certPem);
  //   const certDigest = forge.md.sha256.create();
  //   certDigest.update(
  //     forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
  //   );

  //   const xadesCert = new XAdES.Cert();
  //   xadesCert.CertDigest = new XAdES.DigestAlgAndValueType();
  //   xadesCert.CertDigest.DigestMethod = new XmlDSigJs.AlgorithmIdentifier(
  //     XmlDSigJs.Sha256
  //   );
  //   xadesCert.CertDigest.DigestValue = certDigest.digest().toHex();
  //   xadesCert.IssuerSerial = new XAdES.X509IssuerSerial();
  //   xadesCert.IssuerSerial.X509IssuerName = cert.issuer.attributes
  //     .map((attr) => `${attr.shortName}=${attr.value}`)
  //     .join(',');
  //   xadesCert.IssuerSerial.X509SerialNumber = cert.serialNumber;

  //   signingCertificate.Cert.push(xadesCert);
  // });

  // Generar XML firmado
//  const signedXml = signer.toString();
//  console.log(signedXml);
  
// obtener el xml de la firma
  const nodeSign = signature.GetXml();
  // Obtener el segundo nodo /ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent
  const ublExtensions = xml.getElementsByTagName('ext:UBLExtension')[1]; // Obtener el segundo UBLExtension
  const extensionContent = xml.getElementsByTagName('ext:ExtensionContent')[1]; // Obtener el nodo ExtensionContent

  extensionContent.appendChild(nodeSign);

  // serialize XML
  const oSerializer = new XMLSerializer();
  const sXML = oSerializer.serializeToString(xml);
  await fs.writeFileSync(`./xmlFiles/${nameXML}`, sXML, 'utf-8');

  console.log('documento guardado' + `./xmlFiles/${nameXML}`);
  return sXML;


};

module.exports = { signfile };
