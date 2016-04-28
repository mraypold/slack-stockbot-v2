var StockBot = require('./lib/index.js');

var settings = {
  token: 'PRIVATE KEY',
  name: 'StockBot'
};

var stockBot = new StockBot(settings);
stockBot.run();
