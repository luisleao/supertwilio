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
        github
        gamer, geek, tech, arte, bizz (atributos)
    */

    console.log('EVENT', event);

    // Carregar dados Github
    const githubUserUrl = `https://api.github.com/users/${event.github}`;
    let githubData = null;
    console.log('carregando ', githubUserUrl);
    try {
        const axios = require('axios');
        githubData = (await axios.get(githubUserUrl)).data;
    } catch (error) {
        console.error(error);
        return callback(null, {
            error: true,
            place: 'GITHUB',
            message: `🚨\n\n🇧🇷 O GitHub informado não foi encontrado! Você precisa informar apenas o usuário.\n\n🇺🇸 Your GitHub wasn't found! Please informe only your username.`
        });
    }

    console.log('GITHUB:', githubData);
    if (!githubData) {
        return callback(null, {
            error: true,
            place: 'GITHUB',
            message: `🚨\n\n🇧🇷 O GitHub informado não foi encontrado! Você precisa informar apenas o usuário.\n\n🇺🇸 Your GitHub wasn't found! Please informe only your username.`
        });
    }
    
    // Verificar se soma de pontos não ultrapassa 100
    const MAX_POINTS = 100;
    let totalPoints =  [ 'gamer', 'geek', 'tech', 'arte', 'bizz'].reduce((total, attribute)=>{
        return total + parseInt(event[attribute])
    }, 0)
    if (totalPoints !== MAX_POINTS) {
        // ERRO - total de pontos não confere
        return callback(null, {
            error: true,
            place: 'POINTS',
            message: `🚨\n\n🇧🇷 Você já possui uma conta configurada.\n\n🇺🇸Your already has been registered.`
        });

    }
    
    let participanteId = await md5(limpaNumero(event.From));
    let idPlayerEvent = await md5(`${event.evento}:${limpaNumero(event.From)}`);

    let participanteExiste = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent).get().then(async s => {
        return s.exists;
    });

    if (participanteExiste) {
        // ERRO - Participante já foi registrado
        return callback(null, {
            error: true,
            place: 'ACCOUNT',
            message: `🚨\n\n🇧🇷 Você já possui uma conta configurada.\n\n🇺🇸Your already has been registered.`
        });

    }


    await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent).set({
            github: {
                username: event.github.toLowerCase(),
                ...githubData
            },
            participanteId: participanteId,
            phoneNumber: limpaNumero(event.From),
            createadAt: admin.firestore.FieldValue.serverTimestamp(),
            multiplier: 1,
            gameAttributes: {
                gamer: parseInt(event.gamer), 
                geek: parseInt(event.geek),
                tech: parseInt(event.tech),
                arte: parseInt(event.arte),
                bizz: parseInt(event.bizz)
            }
        });

    
    callback(null, {
        error: false,
        idPlayer: idPlayerEvent,
        qrcode: `https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=https://wa.me/551150393737?text=${idPlayerEvent}`
    });



    /*
        foto (url)
        github
        atributos: gamer, geek, tech, arte, bizz
    */





};
