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
    try {
        const axios = require('axios');
        const githubUserUrl = `https://api.github.com/users/${event.github}`;
        githubData = await axios.get(githubUserUrl);

        console.log('githubData.data', githubData.data);


        if (!githubData.data.login) {
            console.log('PAREI NO LOGIN');
            return callback(null, {
                githubValid: false
            });
        }

        // Verificar se ja existe no banco

        let githubAlreadyUsed = await firestore.collection('events')
            .doc(event.evento).collection('participantes')
            .where('github.username', '==', event.github.toLowerCase())
            .limit(1)
            .get()
            .then(s => {
                console.log('SIZE', s.size);
                return s.size > 0
        });
        console.log('githubAlreadyUsed', githubAlreadyUsed);

        callback(null, {
            githubValid: !githubAlreadyUsed ? true : false
        });


    } catch (e) {
        console.log('ERROR', e);
        callback(null, {
          githubValid: false
        });
    }
  };
  