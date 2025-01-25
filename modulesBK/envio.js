const enviarSobre = async (endPoint, zip64, action) => {
  const sobre = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
   xmlns:wcf="http://wcf.dian.colombia">
   <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
         xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
         <wsu:Timestamp wsu:Id="TS-3011A39995CD7B377F173696960811336">
            <wsu:Created>2025-01-15T19:33:28Z</wsu:Created>
            <wsu:Expires>2025-01-15T19:34:28Z</wsu:Expires>
         </wsu:Timestamp>
         <wsse:BinarySecurityToken EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" wsu:Id="X509-3011A39995CD7B377F173696960810331">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</wsse:BinarySecurityToken>
         <ds:Signature Id="SIG-3011A39995CD7B377F173696960810735"
            xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
            <ds:SignedInfo>
               <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">
                  <ec:InclusiveNamespaces PrefixList="wsa soap wcf"
                     xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#"/>
               </ds:CanonicalizationMethod>
               <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
               <ds:Reference URI="#id-3011A39995CD7B377F173696960810534">
                  <ds:Transforms>
                     <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">
                        <ec:InclusiveNamespaces PrefixList="soap wcf"
                           xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#"/>
                     </ds:Transform>
                  </ds:Transforms>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                  <ds:DigestValue>WHRdXBzIp8M4zjShB73vWp6GwMHXohlqZdEJNidmTzk=</ds:DigestValue>
               </ds:Reference>
            </ds:SignedInfo>
            <ds:SignatureValue>yhulaJQEcLpEQC93oUdEb2T7x4WTz6G2gTtaxdmknwB0VfBUbDEAOkiXCpzfeRmVSEsyTd3yCMVtw6W8ofmPy+J9LxnfJyfG73FZJE3pCqM4S1xBapnSCFqp+aAGQtb4rzhSBqWxFgvFGYRSajaYlbFNgxjM+PYSzsy8UR3n677KUpqWP3CzwbuwUAKC9ZIEyrOHJGuZLvm8w1vJNNJSIcfTI+SoOek9EKUNkHeRQfZkx68IykRLV6Uyopd6bjFNkEMfktm8OwajTxAfQr8uIMrs+tO+b/e4ywmJ8LmACGmD2sLZ5HST/cBpTY8OBORz9rJrEAcIdId33GbPBNckDg==</ds:SignatureValue>
            <ds:KeyInfo Id="KI-3011A39995CD7B377F173696960810332">
               <wsse:SecurityTokenReference wsu:Id="STR-3011A39995CD7B377F173696960810333">
                  <wsse:Reference URI="#X509-3011A39995CD7B377F173696960810331" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>
               </wsse:SecurityTokenReference>
            </ds:KeyInfo>
         </ds:Signature>
      </wsse:Security>
      <wsa:Action>http://wcf.dian.colombia/IWcfDianCustomerServices/SendTestSetAsync</wsa:Action>
      <wsa:To wsu:Id="id-3011A39995CD7B377F173696960810534"
         xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc</wsa:To>
   </soap:Header>
   <soap:Body>
      <wcf:SendTestSetAsync>
         <!--Optional:-->
         <wcf:fileName>Z09004155030002500000136.zip</wcf:fileName>
         <wcf:contentFile>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
         </wcf:contenetFile>
      </wcf:SendTestSetAsync>
   </soap:Body>
</soap:Envelope>`;

  // Construir la solicitud
  const soapEndpoint = endPoint;
  //    'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc';
  const actionUrl = `http://wcf.dian.colombia/IWcfDianCustomerServices/${action}`;

  // Configura los encabezados HTTP
  const headers = {
    'Accept-Encoding': 'gzip,deflate',
    'Content-Type': `application/soap+xml;charset=UTF-8;action="${actionUrl}"`,
    'Content-Length': Buffer.byteLength(sobre),
    Host: 'vpfe-hab.dian.gov.co',
    Connection: 'Kee-Alive',
  };

  // Enviar la solicitud POST
  fetch(soapEndpoint, {
    method: 'POST',
    headers: headers,
    body: zip64,
  })
    .then((response) => {
      if (!response.ok) {
        console.log('err', response);
        return response.text();
      }
    })
    .then((responseXml) => {
      console.log('SOAP Response:', responseXml);
    })
    .catch((error) => {
      console.error('Error:', error);
    });

  enviarSobre();
};
