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


const MAX_TIME = 240;


exports.handler = async function(context, event, callback) {
    const client = await context.getTwilioClient();

    console.log('EVENT:', event);

    // Criar jogo
    // To
    // From
    // opponent: Body - ID em MD5+salt
    // evento

    let idPlayerEvent = await md5(`${event.evento}:${limpaNumero(event.From)}`);
    let idOpponent = event.opponent;


    if (idPlayerEvent == idOpponent) {
        return callback(null, `Você não pode jogar contra você mesmo 👀.`)
    }

    // Verificar player existe
    let playerExist = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent).get().then(async s => {
        return s.exists;
    });
    if (!playerExist) {
        return callback(null, `Seu usuário ainda não fez o registro.`)
    }

    // Verificar adversario existe
    let opponentExist = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idOpponent).get().then(async s => {
        return s.exists;
    });
    if (!opponentExist) {
        return callback(null, `O identificador que você enviou não existe.`)
    }

    // Verificar se já tem partida e timestamp
    const matches = await firestore.collection('events').doc(event.evento).collection('matches')
        .where('players', 'in', [`${idPlayerEvent}_${idOpponent}`, `${idOpponent}_${idPlayerEvent}`])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
        .then(s => {
            return { exists: s.size > 0, data: s.docs.map(s => s.data())[0] }
        });


    if (matches.exists) {
        // if (matches.data.createdAt)
        // Verificar se partida ocorreu a menos de MAX_TIME minutos
        let tempo = (new Date() - matches.data.createdAt.toDate())/1000/60;
        if (tempo < MAX_TIME) {
            return callback(null, `Você pode jogar novamente com esta pessoa em ${Math.floor(MAX_TIME-tempo)} minuto(s)!`);
        }
    }


    // Carregar dados de jogadores
    let playerData = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent).get().then(async s => {
        return s.data();
    });

    let opponentData = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idOpponent).get().then(async s => {
        return s.data();
    });


    // Randomizar elemento
    const elements = [ 'gamer', 'geek', 'tech', 'arte', 'bizz' ];
    const chosenAttribute = elements[Math.floor(Math.random() * elements.length)];
    let playerPoints = 0;
    let opponentPoints = 0;
    let result = '';

    // Pontuar ganhador
        // EMPATE: 1 ponto
        // VENCER: 2 pontos
        // PERDER: 0 ponto
    if (playerData.gameAttributes[chosenAttribute] == opponentData.gameAttributes[chosenAttribute]) {
        playerPoints = 1;
        opponentPoints = 1;
        result = 'EMPATE';
    } else {
        playerPoints = playerData.gameAttributes[chosenAttribute] > opponentData.gameAttributes[chosenAttribute] ? 2 : 0;
        opponentPoints = opponentData.gameAttributes[chosenAttribute] > playerData.gameAttributes[chosenAttribute] ? 2 : 0;
        result = playerData.gameAttributes[chosenAttribute] > opponentData.gameAttributes[chosenAttribute] ? 'PLAYER' : 'OPPONENT';
    }


    const batch = firestore.batch();

    // Adicionar partida
    batch.create(firestore.collection('events').doc(event.evento).collection('matches').doc(), {
        players: `${idPlayerEvent}_${idOpponent}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        attribute: chosenAttribute,
        playerValue: playerData.gameAttributes[chosenAttribute],
        opponentValue: opponentData.gameAttributes[chosenAttribute],
        result: result,
        playerPoints,
        opponentPoints
    });


    // Incrementar pontos
    batch.set(firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent),
        {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            points: admin.firestore.FieldValue.increment(playerPoints),
            accumulatedPoints: admin.firestore.FieldValue.increment(playerPoints),
        }, { merge: true }
    );

    batch.set(firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idOpponent),
        {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            points: admin.firestore.FieldValue.increment(opponentPoints),
            accumulatedPoints: admin.firestore.FieldValue.increment(opponentPoints),
        }, { merge: true }
    );

    await batch.commit()

    const emojis = {
        'gamer': '🧙', 
        'geek': '🦸‍♀️', 
        'tech': '🧑‍💻',
        'arte': '🧑‍🎨', 
        'bizz': '🧑‍💼' 
    }

    let defaultMessage = [];
    defaultMessage.push(`*${playerData.github.login} ❌ ${opponentData.github.login}*`);
    defaultMessage.push(``);
    defaultMessage.push(`---- ${emojis[chosenAttribute]} ${chosenAttribute.toUpperCase()} ----`);
    defaultMessage.push(``);
    defaultMessage.push(`▸ ${playerData.github.login.toLowerCase()} - ${playerData.gameAttributes[chosenAttribute]} ${ result == 'PLAYER' ? '🏆' : ''}${ result == 'OPPONENT' ? '😵' : ''}`);
    defaultMessage.push(`▸ ${opponentData.github.login.toLowerCase()} - ${opponentData.gameAttributes[chosenAttribute]} ${ result == 'PLAYER' ? '😵' : ''}${ result == 'OPPONENT' ? '🏆' : ''}`);
    defaultMessage.push(``);
    defaultMessage.push(`------------------`);


    // Atualizar dados de jogadores
    playerData = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idPlayerEvent).get().then(async s => {
        return s.data();
    });

    opponentData = await firestore.collection('events')
        .doc(event.evento).collection('participantes')
        .doc(idOpponent).get().then(async s => {
        return s.data();
    });


    // Carregar pontos totais de cada um
    let playerMessage = [];
    playerMessage.push(defaultMessage.join('\n'));
    playerMessage.push(`Você tem *${playerData.points}* pontos`);

    let opponentMessage = [];
    opponentMessage.push(defaultMessage.join('\n'));
    opponentMessage.push(`Você tem *${opponentData.points}* pontos`);


    // Enviar mensagem player
    await sendNotification(
        client,
        event.To,
        `whatsapp:${playerData.phoneNumber}`,
        playerMessage.join('\n')
    );

    // Enviar mensagem adversario
    await sendNotification(
        client,
        event.To,
        `whatsapp:${opponentData.phoneNumber}`,
        opponentMessage.join('\n')
    );


    callback(null,'');

};
