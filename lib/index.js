var util = require('util');
var Bot = require('slackbots');
var yahooFinance = require('yahoo-finance');

/**
 * StockBot constructor.
 * @param {object} settings Contains the bot's 'token' and optional 'name'.
 */
var StockBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || 'StockBot';
  this.user = null;
};

util.inherits(StockBot, Bot);

/**
 * Initiate StockBot and replace callbacks with custom implementation.
 */
StockBot.prototype.run = function () {
  StockBot.super_.call(this, this.settings);
  this.on('start', this._onStart);
  this.on('message', this._onMessage);
};

/**
 * Initialize the bot's identity when the bot is first run.
 */
StockBot.prototype._onStart = function() {
  this._setBotUser();
  this._welcomeMessage();
  this._helpMessage();
};

/**
 * Sets StockBots identity to that defined in the Slack room.
 */
StockBot.prototype._setBotUser = function() {
  var self = this;
  this.user = this.users.filter(function(user) {
    return user.name === self.name.toLowerCase();
  })[0];
};

/**
 * Displays a welcome message.
 */
StockBot.prototype._welcomeMessage = function() {
  this.postMessageToChannel(this.channels[0], 'HELLO, WORLD!', {as_user: true});
};

/**
 * Displays a help message.
 */
StockBot.prototype._helpMessage = function() {
  this.postMessageToChannel(
    this.channels[0],
    'To query a stock type $ infront of the ticker symbol',
    {as_user: true});
};

/**
 * Replies with stock information for appropriate message events.
 * @param  {object} message A slack API rtm object.
 * @see {@link https://api.slack.com/rtm}
 */
StockBot.prototype._onMessage = function(message) {
  if(this._isChatMessage(message) && !this._messageFromSelf(message)){
    // TODO potential performance improvement refactor here...
    try {
      var tickers = this._extractTickers(message.text);
      if(tickers.length > 0) {
        tickers = this._cleanTickers(tickers);
        this._replyWithTickerInformation(message, tickers);
      };
    } catch (e) {
      this._replyWithError(message);
    }

  };
};

/**
 * Returns whether the message event is a chat message instead of user typing.
 * @param  {object} message A slack API rtm object.
 * @return {boolean} True if a message, else false.
 * @see {@link https://api.slack.com/rtm}
 * @see Bot.prototype.connect
 */
StockBot.prototype._isChatMessage = function(message) {
  return message.type === 'message' && Boolean(message.text);
};

/**
 * Returns whether the message event is a chat message from self.
 * @param  {object} message A slack API rtm object.
 * @return {boolean} True if message is from self, else false
 * @see {@link https://api.slack.com/rtm}
 */
StockBot.prototype._messageFromSelf = function(message) {
  return message.user === this.user.id;
};

/**
 * Returns an array of tickers if there exists one or more in the message.
 * @param  {string} message A message to be parsed
 * @return {string:array} An array of tickers, else an array of nothing.
 */
StockBot.prototype._extractTickers = function(message) {
  var re = /\$[^\d\W]+/g; // Matches any words (no numbers) prefaced by $.
  var tickers = message.match(re);
  return tickers ? tickers : []
};

/**
 * Returns an an array of tickers cleaned of non-alphabetic characters.
 * @param  {string:array} tickers An array of tickers.
 * @return {string:array} An array of tickers.
 */
StockBot.prototype._cleanTickers = function(tickers) {
  for(var i = 0; i < tickers.length; i++) {
    tickers[i] = tickers[i].replace(/[^a-zA-Z\d\s:]/g, '').toLowerCase();
  };
  return tickers;
};

/**
 * Return a channel matching the given channel id.
 * @param  {number} channelId A slack channel id.
 * @return {object} A channel.
 */
StockBot.prototype._getChannelById = function(channelId) {
  return this.channels.filter(function(item) {
    return item.id === channelId;
  })[0];
};

/**
 * Queries the tickers and and outputs to a slack channel.
 * @param  {object} message A slack API rtm object.
 * @param  {string:array} tickers An array to ticker symbols to query.
 * @see {@link https://github.com/pilwon/node-yahoo-finance/blob/master/lib/fields.js}
 */
StockBot.prototype._replyWithTickerInformation = function(message, tickers) {
  var self = this;

  yahooFinance.snapshot({
    symbols: tickers,
    fields: ['a', 'p2'] // ask, change (percent)
  }, function(error, snapshot) {
    if(error) {
      message.text = "Error retrieving stock data from yahoo finance."
      self._replyWithError(message);
    } else {
      self._replyWithStockInformation(message, snapshot);
    }
  });

};

/**
 * Posts the stock information in the channel where it was queried from.
 * @param  {object} message A slack API rtm object.
 * @param  {object:array} snapshot An array containing snapshot objects.
 * @see {_replyWithTickerInformation}
 */
StockBot.prototype._replyWithStockInformation = function(message, snapshot) {
  var channel = this._getChannelById(message.channel);

  var response = '';
  for(var i = 0; i < snapshot.length; i++) {
    var builder = '';
    if(('symbol' in snapshot[i]) && ('ask' in snapshot[i])) {
      builder += snapshot[i]['symbol'];
      builder += " : $";
      builder += snapshot[i]['ask'];
      response += builder;
    }

    if('changeInPercent' in snapshot[i]) {
      var rounded = Math.round(snapshot[i]['changeInPercent'] * 100) / 100;
      response += ' (' + rounded + '%)';
    }
    response += '\n';
  }
  this.postMessageToChannel(channel.name, response, {as_user: true});
};

/**
 * Posts an error message in the slack channel.
 * @param  {object} message A slack API rtm object with an updated 'text' value.
 */
StockBot.prototype._replyWithError = function(message) {
  var channel = this._getChannelById(message.channel);
  this.postMessageToChannel(channel.name, message.text, {as_user: true});
};

module.exports = StockBot;
