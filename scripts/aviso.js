// Impressão das etiquetas com múltiplas impressoras.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
require("dotenv").config();
const cliente = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;


// Initialize Firebase
var admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}else {
   admin.app(); // if already initialized, use that one
}
const firestore = admin.firestore();

let MENSAGEM = `[_____SUA_MENSAGEM_____]`;


const init = async () => {
    let i = 0;
    console.log('Iniciando envio avisos...');
    firestore.collection('events').doc('cpbr2022').collection('participantes')
    .get().then(async s => {
        console.log('Size', s.size);

        // // TESTE DE ENVIO
        // const NUMERO = process.env.MY_PHONE_NUMBER;
        // await cliente.messages.create({
        //     from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        //     to: `whatsapp:${NUMERO}`,
        //     body: MENSAGEM
        // }).then(c => {
        //     console.log(c.sid);
        // });

        s.forEach(async d => {
            const dados = d.data();
            i++;
            console.log(i, d.id, dados.phoneNumber);

            await cliente.messages.create({
                from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${dados.phoneNumber}`,
                body: MENSAGEM
            }).then(c => {
                console.log(c.sid);
            });

            await firestore.collection('events').doc('frontin').collection('participantes')
                .doc(d.id).set({
                    avisoResultadoGincana: true
                }, { merge: true });
        });
    })
};

init();