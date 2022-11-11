const admin = require('firebase-admin');
process.env.GOOGLE_APPLICATION_CREDENTIALS = Runtime.getAssets()['/firebase-credentials.json'].path;
const { escondeNumero, limpaNumero, getDDD, sendNotification } = require(Runtime.getFunctions()['util'].path);

if (!admin.apps.length) {
    admin.initializeApp({});
} else {
    admin.app();
}
const firestore = admin.firestore();
const md5 = require('md5');


exports.handler = async function(context, event, callback) {

    let participanteId = await md5(limpaNumero(event.From));
    let participanteIdEvento = await md5(`${event.evento}:${limpaNumero(event.From)}`);

    // let networkedId = event.token.toLowerCase();

    // Registrar participante na base geral
    await firestore.collection('participantes')
        .doc(participanteId).set({
            phoneNumber: limpaNumero(event.From),
            profileName: event.profileName || '',
            ultimoEvento: event.evento,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    

    let participanteExiste = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(participanteIdEvento).get().then(async s => {
        return s.exists;
    });

    callback(null, participanteExiste);

};

