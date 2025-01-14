const { response } = require('express');

const {
  generarHashSHA384,
  createfilename,
  actualizaSoftCode,
  actualizaCUFE,
  changeDateFormat,
  crearZIPadm,
} = require('../modulesBK/createXML');

const { signfile } = require('../modulesBK/firmar');

//const { sendSoapRequest } = require('../modulesBK/envio');

const envioDian = async (req, res = response) => {
  try {
    //extraer data para calcular CUFE y softcode
    const raiz = req.body.params;
    const softid = raiz.soft[0].softid[0];
    const nodctos = raiz.soft[0].nodctos[0];
    const init = raiz.soft[0].initName[0];
    const NoFra = raiz.cufe[0].NoFra[0];
    const consecutivo = raiz.cufe[0].consecutivo[0];
    const FechaFactura = raiz.cufe[0].FechaFactura[0];
    const HoraFactura = raiz.cufe[0].HoraFactura[0];
    const VrBase = raiz.cufe[0].VrBase[0];
    const Imp = raiz.cufe[0].Imp[0];
    const VrTotal = raiz.cufe[0].VrTotal[0];
    const Nit = raiz.cufe[0].Nit[0];
    const cc = raiz.cufe[0].cc[0];
    const claveTc = raiz.cufe[0].claveTc[0];
    const ambient = raiz.cufe[0].ambient[0];

    // calcular softcode y CUFE
    const softCode = await generarHashSHA384(softid + '4620' + nodctos);

    const CUFE = await generarHashSHA384(
      NoFra +
        FechaFactura +
        HoraFactura +
        VrBase +
        '010.00' +
        '04' +
        Imp +
        '030.00' +
        VrTotal +
        Nit +
        cc +
        claveTc +
        ambient
    );

    let tyeDoc;
    switch (init) {
      case 'fv':
        tyeDoc = 'Invoice';
        break;
      case 'nc':
        tyeDoc = 'CreditNote';
        break;
      case 'nd':
        tyeDoc = 'DebitNote';
        break;
      default:
        break;
    }
    
    // Actualizar el xml para firma con el CUFE y el softcode
    await actualizaCUFE(softCode, CUFE, tyeDoc);
    //await actualizaSoftCode(softCode, CUFE, tyeDoc);

    // crear el nombre del xml para firmar
    const { nameXML, folderName } = await createfilename(
      FechaFactura,
      Nit,
      consecutivo,
      init
    );
    // cambiar el formato de la fecha
    const date = await changeDateFormat();

    //firmar con la llave privada y actualizar nombre
    const signed = await signfile(nameXML, date);
    // comprimir en un zip el xml firmado y convertido en base64
    await crearZIPadm(signed, nameXML, folderName);

    //crear el sobre soap y firmarlo
    //await createSoap(folderName);

    //enviar a la dian mediante axios y recibir la respuesta

    //en la respuesta del envio a la dian viene un xml con la respuesta. si la respuesta es aprobado, deveulve el cufe
    // si la respuesta es rechazada, devuelve el nombre del xml firmado
    res.status(200).send(CUFE);
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: 'Favor comunicarse con el administrador',
    });
  }
};

//sendSoapRequest();

module.exports = { envioDian };
