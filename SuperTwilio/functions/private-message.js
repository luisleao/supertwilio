exports.handler = async function(context, event, callback) {
  try {
      const axios = require('axios');
      const githubUserUrl = `https://api.github.com/users/${event.github}`;
      githubData = await axios.get(githubUserUrl);
      callback(null, {
        githubValid: githubData.data ? true : false
      });
  } catch (e) {
      callback(null, {
        githubValid: false
      });
  }
};
