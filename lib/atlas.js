/* jshint node:true */
'use strict';

var       fs = require('fs');
var  request = require('request');
var        Q = require('q');
var        _ = require('underscore');
var readline = require('readline');

parseArgs(process.argv);

function parseArgs(args) {
  switch (args[2]) {
    case 'add': add(args); break;
    case 'remove': remove(args); break;
    case 'list': list(args); break;
    case 'start': start(args); break;
    case 'stop': stop(args); break;
    case 'help': help(args); break;
    default: help(args);
  }
}

function help() {
  console.log('Valid Commands:');
  console.log('===============');
  console.log('atlas list');
  console.log('atlas list servers');
  console.log('atlas add server');
  console.log('atlas add node');
  console.log('atlas remove node <url>');
  console.log('atlas remove info <url>');
  console.log('atlas help');
  console.log('atlas start <url>');
  console.log('atlas stop <url>');
}

function add(args) {
  if (args[3] === 'server') {
    console.log('Adding a Server');
    console.log('---------------');
    console.log('To add a server, first install atlas-server on the desired box and');
    console.log('make sure that you\'ve followed the Getting Started instructions on');
    console.log('that box. When you\'re finished, you should have the server IP as');
    console.log('well as a secure token.\n');

    var results = {};
    rl('Server IP: ').then(function (ip) {
      results.ip = ip;
      return rl('Server Port (59241): ');
    }).then(function (port) {
      results.port = port || 59241;
      results.url = 'http://' + results.ip + ':' + results.port;
      return rl('Secure Token: ');
    }).then(function (token) {
      results.token = token;
      return rl('Server Name (' + results.url + '): ');
    }).then(function (name) {
      results.name = name || results.url;
      doRequest(results);
    });

    // if (!ip || !token) throw error
    // validate url;
  } else if (args[3] == 'node') {
    console.log('Adding a Node');
    console.log('---------------');

    var config = loadConfig();
    var results = {};
    rl('Git URL: ').then(function (git) {
      results.git = git;
      return rl('Domain Name: ');
    }).then(function (domain) {
      results.domain = domain;
      return rl('Subdomain: ');
    }).then(function (subdomain) {
      results.subdomain = subdomain;
      addNode(config, results);
    });
  } else {
    help();
  }
}


function addNode(config, body) {
  var server = config.servers[0];
  var url = 'http://' + server.ip + ':' + server.port;
  body.token = server.token;

  request({
    method: 'POST',
    url: url + '/addServer',
    json: body
  }, function (err, resp, body) {
    if (err) return console.error('\nError: Unable to connect to your server. Double check the ip and port\n');
    if (!body.success) {
      console.log(body);
      return console.error('\nError: Invalid Token.\n');
    }
    console.log(body);
  });
}


function doRequest(results) {
  request({
    method: 'POST',
    url: results.url + '/verify',
    json: { token: results.token }
  }, function (err, resp, body) {
    if (err) return console.error('\nError: Unable to connect to your server. Double check the ip and port\n');
    if (!body.success) {
      console.log(body);
      return console.error('\nError: Invalid Token.\n');
    }
    console.log('\nServer and Token have been successfully verified and added to your list!!\n');
    var json = {
      name: results.name,
      ip: results.ip,
      port: results.port,
      token: results.token
    };

    // if .atlasrc doesn't exist, create it
    var config;
    try {
      config = fs.readFileSync('.atlasrc');
      config = JSON.parse(config);
    } catch (e) {
      config = { servers: [] };
    }
    config.servers.push(json);
    fs.writeFileSync('.atlasrc', JSON.stringify(config));
  });
}


function remove(args) {
  if (args[3] === 'node') {
    if (!args[4]) return console.error('Must enter valid URL');

    var config = loadConfig();
    _.each(config.servers, function (server) {
      var url = 'http://' + server.ip + ':' + server.port;
      request({
        method: 'POST',
        url: url + '/removeServer',
        json: { token: server.token, url: args[4] }
      }, function (err, resp, body) {
        if (err) return console.error('Could not connect to server');
        if (!body.success) {
          console.error(body);
          return console.error('Token Invalid or Expired');
        }
        console.log(body);
      });
    });

  } else if (args[3] === 'info') {
    if (!args[4]) return console.error('Must enter valid URL');

    var config = loadConfig();
    _.each(config.servers, function (server) {
      var url = 'http://' + server.ip + ':' + server.port;
      request({
        method: 'POST',
        url: url + '/removeInfo',
        json: { token: server.token, url: args[4] }
      }, function (err, resp, body) {
        if (err) return console.error('Could not connect to server');
        if (!body.success) {
          console.error(body);
          return console.error('Token Invalid or Expired');
        }
        console.log(body);
      });
    });
  } else {
    help();
  }
}


function start(args) {
  if (!args[3]) return console.error('Must enter valid URL');
  var subdomain = args[3];

  var config = loadConfig();
  _.each(config.servers, function (server) {
    var url = 'http://' + server.ip + ':' + server.port;
    request({
      method: 'POST',
      url: url + '/startServer',
      json: { token: server.token, url: subdomain }
    }, function (err, resp, body) {
      if (err) return console.error('Could not connect to server');
      if (!body.success) {
        console.error(body);
        return console.error('Token Invalid or Expired');
      }
      console.log(body);
    });
  });
}

function stop(args) {
  if (!args[3]) return console.error('Must enter valid URL');
  var subdomain = args[3];

  var config = loadConfig();
  _.each(config.servers, function (server) {
    var url = 'http://' + server.ip + ':' + server.port;
    request({
      method: 'POST',
      url: url + '/stopServer',
      json: { token: server.token, url: subdomain }
    }, function (err, resp, body) {
      if (err) return console.error('Could not connect to server');
      if (!body.success) {
        console.error(body);
        return console.error('Token Invalid or Expired');
      }
      console.log(body);
    });
  });
}

function loadConfig() {
  var config;
  try {
    config = fs.readFileSync('.atlasrc');
    config = JSON.parse(config);
  } catch (e) {
    config = { servers: [] };
  }
  return config;
}

function list(args) {
  switch (args[3]) {
    case 'all': listAll(); break;
    case 'servers': listServers(); break;
    case 'domains': listDomains(); break;
    case 'help': listHelp(); break;
    default: listNodes();
  }
}

function listNodes() {
  var config;
  try {
    config = fs.readFileSync('.atlasrc');
    config = JSON.parse(config);
  } catch (e) {
    config = { servers: [] };
  }

  _.each(config.servers, function (server) {
    var url = 'http://' + server.ip + ':' + server.port;
    getNodes(url, server.token).then(function (nodes) {
      console.log('=========================');
      console.log('Server | Node | Status');
      console.log('=========================');
      _.each(nodes, function (node) {
        console.log(server.name + ' | ' + node.url + ' | ' + node.state);
      });
    });
  });
}

function listServers() {
  var config;
  try {
    config = fs.readFileSync('.atlasrc');
    config = JSON.parse(config);
  } catch (e) {
    config = { servers: [] };
  }

  console.log('Servers');
  console.log('-------');
  for (var i = 0; i < config.servers.length; ++i) {
    var s = config.servers[i];
    var url = 'http://' + s.ip + ':' + s.port;
    console.log((i + 1) + ': ' + s.name + ' (' + url + ')');
  }
}

function listDomains() {
  var config;
  try {
    config = fs.readFileSync('.atlasrc');
    config = JSON.parse(config);
  } catch (e) {
    config = { servers: [] };
  }

  var promises = [];
  for (var i = 0; i < config.servers.length; ++i) {
    var s = config.servers[i];
    var url = 'http://' + s.ip + ':' + s.port;
    promises.push(getDomains(url, s.token));
  }


  Q.allSettled(promises).then(function (results) {
    console.log('Domains');
    console.log('-------');
    var k = 0;
    for (var i = 0; i < results.length; ++i) {
      if (results[i].status === 'fulfilled') {
        for (var j = 0; j < results[i].data.length; ++j) {
          console.log((++k) + results[i].data[j] + ' (' + config.servers[i].name + ')');
        }
      } else {
        console.log('ERROR: ' + results[i].reason + ': ' + config.servers[i].name);
      }
    }
  });
}

function getDomains(url, token) {
  var deferred = Q.defer();
  request({
    method: 'POST',
    url: url + '/getDomains',
    json: { token: token }
  }, function (err, resp, body) {
    if (err) return deferred.reject('Could not connect to server');
    console.error(body);
    if (!body.success) return deferred.reject('Token Invalid or Expired');
    deferred.resolve(body.domains);
  });
  return deferred.promise;
}

function getNodes(url, token) {
  var deferred = Q.defer();
  request({
    method: 'POST',
    url: url + '/listServers',
    json: { token: token }
  }, function (err, resp, body) {
    if (err) return deferred.reject('Could not connect to server');
    console.error(body);
    if (!body.success) return deferred.reject('Token Invalid or Expired');
    deferred.resolve(body.servers);
  });
  return deferred.promise;
}

// server list is kept locally
// domain list is kept per server

function rl(prompt) {
  var deferred = Q.defer();

  var _rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  _rl.question(prompt, function (res) {
    deferred.resolve(res.trim());
    _rl.close();
  });

  return deferred.promise;
}
