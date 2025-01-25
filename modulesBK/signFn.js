const { SignedXml } = require('xadesjs');
const { Crypto } = require('@peculiar/webcrypto');
const crypto = new Crypto();
const fs = require('fs');
global.crypto = crypto;
const forge = require('node-forge');

const obtenerCadenaCerts = () => {
  console.log('firstCert');
  function normalizeCertificate(certPem) {
    if (!certPem || typeof certPem !== 'string') {
      throw new Error('El certificado no es válido o está vacío.');
    }

    // Normalizar eliminando encabezados y pies
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\r?\n|\r/g, ''); // Eliminar saltos de línea

    return certBase64;
  }

  try {
    // Leer el archivo PFX
    const pfxBuffer = fs.readFileSync('./andes/certificado.pfx');
    const password = '9Ep3KxPRph';

    // Cargar el archivo PFX
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // Extraer los certificados del PFX
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    if (
      !certBags[forge.pki.oids.certBag] ||
      certBags[forge.pki.oids.certBag].length === 0
    ) {
      throw new Error('No se encontraron certificados en el archivo PFX.');
    }

    // Iterar sobre los certificados y normalizarlos
    const x509Certificates = certBags[forge.pki.oids.certBag].map(
      (bag, index) => {
        if (bag.cert) {
          const certPem = forge.pki.certificateToPem(bag.cert); // Convertir a PEM
          const normalizedCert = normalizeCertificate(certPem); // Normalizar el formato
          fs.writeFileSync(`./andes/cert-${index}.pem`, certPem);
          fs.writeFileSync(`./andes/certB64-${index}.pem`, normalizedCert);
          return normalizedCert; // Agregar a la lista de certificados
        } else {
          return console.warn(
            'Certificado vacío encontrado en el archivo PFX.'
          );
        }
      }
    );

    if (x509Certificates.length === 0) {
      throw new Error(
        'No se pudieron extraer certificados válidos del archivo PFX.'
      );
    }

    // console.log('Certificados Normalizados:', x509Certificates);
  } catch (error) {
    console.error('Ocurrió un error:', error.message);
  }
};
// generar los 3 certssss--------------------
const generarSigningCertificates = () => {
  // Función para calcular el digest y preparar un elemento <Cert>
  function prepareCert(certPem) {
    const cert = forge.pki.certificateFromPem(certPem);
    const certDer = forge.asn1
      .toDer(forge.pki.certificateToAsn1(cert))
      .getBytes();
    const digest = forge.util.encode64(
      forge.md.sha256.create().update(certDer).digest().bytes()
    );

    const issuerName = cert.issuer.attributes
      .map((attr) => `${attr.shortName}=${attr.value}`)
      .join(', ');
    const serialNumber = new forge.jsbn.BigInteger(
      cert.serialNumber,
      16
    ).toString();

    return {
      digest,
      issuerName,
      serialNumber,
    };
  }

  // Certificados en formato PEM (firma, intermediario, raíz)

  const signerCertPem = fs.readFileSync('./andes/cert-0.pem', {
    encoding: 'utf8',
  });

  const intermediateCertPem = fs.readFileSync('./andes/cert-1.pem', {
    encoding: 'utf8',
  });

  const rootCertPem = fs.readFileSync('./andes/cert-2.pem', {
    encoding: 'utf8',
  });

  // Generar los elementos <Cert> para los 3 certificados
  const certs = [
    prepareCert(signerCertPem),
    prepareCert(intermediateCertPem),
    prepareCert(rootCertPem),
  ];
  return certs;
};

module.exports = { obtenerCadenaCerts, generarSigningCertificates };
