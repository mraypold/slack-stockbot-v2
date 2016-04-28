'use strict';

var assert = require('chai').assert;
var StockBot = require('../lib/index.js');

var stockBot = new StockBot({
    name: 'StockBot',
    token: 'TOKEN-GOES-HERE'
});

beforeEach(function() {
  stockBot = new StockBot({
    name: 'StockBot',
    token: 'TOKEN-GOES-HERE'
  });
});

describe('stockbot', function () {

  it('isChatMessage should be true for a chat message', function (done) {
    var message = {
      "type": "message",
      "ts": "1358878749.000002",
      "user": "U023BECGF",
      "text": "Hello"
    };
    assert(stockBot._isChatMessage(message) === true);
    done();
  });

  it('isChatMessage should be false for a non-message event', function (done) {
    var message = {
      "type": "bot_changed",
      "bot": {
          "id": "B024BE7LH",
          "name": "hugbot",
          "icons": {
              "image_48": "https:\/\/slack.com\/path\/to\/hugbot_48.png"
          }
      }
    };
    assert(stockBot._isChatMessage(message) === false);
    done();
  });

  it('isChatMessage should be false if there is no content', function (done) {
    var message = {
      "type": "message",
      "ts": "1358878749.000002",
      "user": "U023BECGF",
      "text": ""
    };
    assert(stockBot._isChatMessage(message) === false);
    done();
  });

  it('messageFromSelf should be true if the message event is from StockBot', function (done) {
    stockBot.user = {
      name: "StockBot",
      id: "U023BECGF"
    };
    var message = {
      "type": "message",
      "ts": "1358878749.000002",
      "user": "U023BECGF",
      "text": "Hello, World!"
    };
    assert(stockBot._messageFromSelf(message) === true);
    done();
  });

  it('messageFromSelf should be false if the message event is not from StockBot', function (done) {
    stockBot.user = {
      name: "Jerry Macquire",
      id: "U023BECGF"
    };
    var message = {
      "type": "message",
      "ts": "1358878749.000002",
      "user": "U02939303",
      "text": "Jerry Macquire is an awesome movie!"
    };
    assert(stockBot._messageFromSelf(message) === false);
    done();
  });

  it('extractTickers should return an empty array when no tickers exist', function (done) {
    var tickers = stockBot._extractTickers("There is not ticker here. nah-nah-nah.");
    assert(tickers.length === 0);
    done();
  });

  it('extractTickers should return an array with multiple tickers', function (done) {
    var tickers = stockBot._extractTickers("Can you get data on $MSFT and $GS");
    assert(tickers.length === 2);
    assert(tickers.indexOf("$MSFT") >= 0);
    assert(tickers.indexOf("$GS") >= 0);
    done();
  });

  it('cleanTickers should return an array of tickers containing only letters', function (done) {
    var tickers = ['$msft', '$gs'];
    tickers = stockBot._cleanTickers(tickers);
    assert(tickers.length === 2);
    assert(tickers.indexOf("msft") >= 0);
    assert(tickers.indexOf("gs") >= 0);
    done();
  });

  it('cleanTickers should return an array of tickers in lowercase', function (done) {
    var tickers = ['$MSFT'];
    tickers = stockBot._cleanTickers(tickers);
    assert(tickers.length === 1);
    assert(tickers.indexOf("msft") >= 0);
    done();
  });

  it('getChannelById should return a channel matching the given id', function (done) {
    stockBot.channels = [
      {
        id: 0,
        name: 'channel 0'
      },
      {
        id: 1,
        name: 'channel 1'
      }
    ];
    var channel = stockBot._getChannelById(0);
    assert(channel.id === 0);
    done();
  });

});
