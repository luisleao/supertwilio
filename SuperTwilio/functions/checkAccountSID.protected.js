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
    
    /*
        foto (url)
        github
        atributos: gamer, geek, tech, arte, bizz

    */
    
    callback(null,'OK');




};
