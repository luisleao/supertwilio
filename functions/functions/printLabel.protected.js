const admin = require('firebase-admin');
process.env.GOOGLE_APPLICATION_CREDENTIALS = Runtime.getAssets()['/firebase-credentials.json'].path;
const { escondeNumero, limpaNumero, getDDD, sendNotification, convertNewLine, fillParams } = require(Runtime.getFunctions()['util'].path);

if (!admin.apps.length) {
  admin.initializeApp({}); 
} else {
  admin.app();
}
const firestore = admin.firestore();
const md5 = require('md5');


async function getBase64(url) {
    const axios = require('axios');
    return await axios
      .get(url, {
        responseType: 'arraybuffer'
      })
      .then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

/*
    event: evento, token, From, To
*/
exports.handler = async function(context, event, callback) {
    let participanteId = await md5(limpaNumero(event.From));
    let idPlayerEvent = await md5(`${event.evento}:${limpaNumero(event.From)}`);

    let player = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent).get().then(async s => {
        return s.data();
    });

    let picture = await getBase64(player.github.avatar_url);


    let id = await firestore.collection('labels')
        .add({
            url: `https://wa.me/${limpaNumero(event.To, true)}?text=${idPlayerEvent}`,
            evento: event.evento,
            printer: event.token.toUpperCase(),
            telefone: escondeNumero(limpaNumero(event.From)),
            participanteId: participanteId,
            github: player.github.login,
            picture: picture,
            idPlayerEvent: idPlayerEvent
        }).then(s => {
            return s.id
        });
    
    callback(null, id);

};
