exports.handler = async function(context, event, callback) {

  const axios = require('axios');
  const githubUserUrl = `https://api.github.com/users/${event.github}`;
  githubData = await axios.get(githubUserUrl);


  // const assets = Runtime.getAssets();
  // const privateMessageAsset = assets['/message.js'];
  // const privateMessagePath = privateMessageAsset.path;
  // const privateMessage = require(privateMessagePath);
  // const twiml = new Twilio.twiml.MessagingResponse();
  // twiml.message(privateMessage());

  callback(null, githubData.data);
};
