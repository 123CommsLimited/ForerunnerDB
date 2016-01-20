"use strict";

// NOTE: This class instantiates individually but shares a single
// http server after listen() is called on any instance

// Import external names locally
var Shared = require('./Shared'),
	express = require('express'),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	async = require('async'),
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	url = require('url'),
	app = express(),
	server,
	Core,
	CoreInit,
	Db,
	NodeApiServer,
	ReactorIO,
	Overload,
	_access = {},
	_io = {};

NodeApiServer = function () {
	this.init.apply(this, arguments);
};

/**
 * The init method that can be overridden or extended.
 * @param {Core} core The ForerunnerDB core instance.
 */
NodeApiServer.prototype.init = function (core) {
	var self = this;
	self._core = core;
	self._app = app;

	this.name('ApiServer');
};

Shared.addModule('NodeApiServer', NodeApiServer);
Shared.mixin(NodeApiServer.prototype, 'Mixin.Common');
Shared.mixin(NodeApiServer.prototype, 'Mixin.ChainReactor');

Core = Shared.modules.Core;
CoreInit = Core.prototype.init;
Db = Shared.modules.Db;
ReactorIO = Shared.modules.ReactorIO;
Overload = Shared.overload;

Shared.synthesize(NodeApiServer.prototype, 'name');

/**
 * Starts the rest server listening for requests against the ip and
 * port number specified.
 * @param {String} host The IP address to listen on, set to 0.0.0.0 to
 * listen on all interfaces.
 * @param {String} port The port to listen on.
 * @param {Object} options An options object.
 * @param {Function=} callback The method to call when the server has
 * started (or failed to start).
 * @returns {NodeApiServer}
 */
NodeApiServer.prototype.start = function (host, port, options, callback) {
	var ssl,
		httpServer;

	// Start listener
	if (!server) {
		if (options && options.cors === true) {
			app.use(cors({origin: true}));

			// Allow preflight CORS
			app.options('*', cors({origin: true}));
		}

		// Parse JSON as a query parameter
		app.use(function (req, res, next) {
			var query,
				urlObj = url.parse(req.url);

			if (req.json || !urlObj.query) {
				return next();
			}

			try {
				query = url.parse(req.url).query;

				if (query) {
					req.json = JSON.parse(decodeURIComponent(query));
				}

				return next();
			} catch (e) {
				res.status(500).send(e);
			}
		});

		// Parse body in requests
		app.use(bodyParser.json());

		// Activate routes
		this._defineRoutes();

		if (options && options.ssl && options.ssl.enable) {
			ssl = {
				key: fs.readFileSync(options.ssl.key),
				cert: fs.readFileSync(options.ssl.cert)
			};

			if (options.ssl.ca) {
				ssl.ca = [];
				for (i = 0; i < options.ssl.ca.length; i++) {
					ssl.ca.push(fs.readFileSync(options.ssl.ca[i]));
				}
			}

			httpServer = https.createServer(ssl, app);
		} else {
			httpServer = http.createServer(app);
		}

		server = httpServer.listen(port, host, function (err) {
			if (!err) {
				if (options && options.ssl && options.ssl.enable) {
					console.log('ForerunnerDB REST API listening at https://%s:%s', host, port);
				} else {
					console.log('ForerunnerDB REST API listening at http://%s:%s', host, port);
				}

				if (callback) {
					callback(false, server);
				}
			} else {
				console.log('Listen error', err);
				callback(err);
			}
		});
	} else {
		// Server already running
		if (callback) {
			callback(false, server);
		}
	}

	return this;
};

/**
 * Stops the server listener.
 */
NodeApiServer.prototype.stop = function () {
	if (server) {
		server.close();
		return true;
	}

	return false;
};

/**
 * Handles requests from clients to the endpoints the database exposes.
 * @param req
 * @param res
 */
NodeApiServer.prototype.handleRequest = function (req, res) {
	var self = this,
		method = req.method,
		dbName = req.params.dbName,
		objType = req.params.objType,
		objName = req.params.objName,
		objId = req.params.objId,
		query,
		options,
		db,
		obj;

	// Check permissions
	self.hasPermission(dbName, objType, objName, method, req, function (err, results) {
		if (!err) {
			// Check if the database has this type of object
			// TODO: Do we want to call collectionExists (objType + 'Exists') here?
			if (typeof self._core.db(dbName)[objType] === 'function') {
				// Get the query and option params
				query = req.json && req.json.query ? req.json.query : undefined;
				options = req.json && req.json.options ? req.json.options : undefined;

				db = self._core.db(dbName);
				obj = db[objType](objName);

				switch (method) {
					case 'GET':
						if (!objId) {
							// Get all
							if (obj.isProcessingQueue && obj.isProcessingQueue()) {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
								}

								obj.once('ready', function () {
									if (db.debug()) {
										console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
									}
									res.send(obj.find(query, options));
								});
							} else {
								res.send(obj.find(query, options));
							}
						} else {
							// Get one
							if (obj.isProcessingQueue && obj.isProcessingQueue()) {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
								}

								obj.once('ready', function () {
									if (db.debug()) {
										console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
									}
									res.send(obj.findById(objId, options));
								});
							} else {
								res.send(obj.findById(objId, options));
							}
						}
						break;

					case 'POST':
						if (obj.isProcessingQueue && obj.isProcessingQueue()) {
							if (db.debug()) {
								console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
							}

							obj.once('ready', function () {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
								}

								obj.insert(req.body, function (result) {
									res.send(result);
								});
							});
						} else {
							obj.insert(req.body, function (result) {
								res.send(result);
							});
						}
						break;

					case 'PUT':
						if (obj.isProcessingQueue && obj.isProcessingQueue()) {
							if (db.debug()) {
								console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
							}

							obj.once('ready', function () {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
								}

								res.send(obj.updateById(objId, {$replace: req.body}));
							});
						} else {
							res.send(obj.updateById(objId, {$replace: req.body}));
						}
						break;

					case 'PATCH':
						if (obj.isProcessingQueue && obj.isProcessingQueue()) {
							if (db.debug()) {
								console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
							}

							obj.once('ready', function () {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
								}

								res.send(obj.updateById(objId, req.body));
							});
						} else {
							res.send(obj.updateById(objId, req.body));
						}
						break;

					case 'DELETE':
						if (!objId) {
							// Remove all
							if (obj.isProcessingQueue && obj.isProcessingQueue()) {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
								}

								obj.once('ready', function () {
									if (db.debug()) {
										console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
									}
									res.send(obj.remove(query, options));
								});
							} else {
								res.send(obj.remove(query, options));
							}
						} else {
							// Remove one
							if (obj.isProcessingQueue && obj.isProcessingQueue()) {
								if (db.debug()) {
									console.log(db.logIdentifier() + ' Waiting for async queue: ' + objName);
								}

								obj.once('ready', function () {
									if (db.debug()) {
										console.log(db.logIdentifier() + ' Async queue complete: ' + objName);
									}
									res.send(obj.removeById(objId, options));
								});
							} else {
								res.send(obj.removeById(objId, options));
							}
						}
						break;

					default:
						res.status(403).send('Unknown method');
						break;
				}
			} else {
				res.status(500).send('Unknown object type: ' + objType);
			}
		} else {
			res.status(403).send(err);
		}
	});
};

/**
 * Handles client requests to open an EventSource connection to our
 * server-sent events server.
 * @param req
 * @param res
 */
NodeApiServer.prototype.handleSyncRequest = function (req, res) {
	var self = this,
		dbName = req.params.dbName,
		objType = req.params.objType,
		objName = req.params.objName,
		db,
		obj;

	// Check permissions
	self.hasPermission(dbName, objType, objName, "SYNC", req, function (err, results) {
		if (!err) {
			// Check if the database has this type of object
			// TODO: Do we want to call collectionExists (objType + 'Exists') here?
			if (typeof self._core.db(dbName)[objType] === 'function') {
				db = self._core.db(dbName);
				obj = db[objType](objName);

				// Let request last as long as possible
				req.socket.setTimeout(0x7FFFFFFF);

				// Ensure we have basic IO objects set up
				_io[objType] = _io[objType] || {};
				_io[objType][objName] = _io[objType][objName] || {
						messageId: 0,
						clients: []
					};

				// Add this resource object the io clients array
				_io[objType][objName].clients.push({req: req, res: res});

				// Check if we already have an io for this object
				if (!_io[objType][objName].io) {
					// Setup a chain reactor IO node to intercept CRUD packets
					// coming from the object (collection, view etc), and then
					// pass them to the clients
					_io[objType][objName].io = new ReactorIO(obj, self, function (chainPacket) {
						switch (chainPacket.type) {
							case 'insert':
								self.sendToAll(_io[objType][objName], chainPacket.type, chainPacket.data);
								break;

							case 'remove':
								self.sendToAll(_io[objType][objName], chainPacket.type, {query: chainPacket.data.query});
								break;

							case 'update':
								self.sendToAll(_io[objType][objName], chainPacket.type, {
									query: chainPacket.data.query,
									update: chainPacket.data.update
								});
								break;

							default:
								break;
						}

						// Returning false informs the chain reactor to continue propagation
						// of the chain packet down the graph tree
						return false;
					});
				}

				// Send headers for event-stream connection
				res.writeHead(200, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				});

				res.write('\n');

				// Send connected message to the client with messageId zero
				self.sendToClient(res, 0, 'connected', "{}");

				req.on("close", function() {
					// Remove this client from the array
					var index = _io[objType][objName].clients.indexOf(res);

					if (index > -1) {
						_io[objType][objName].clients.splice(index, 1);
					}
				});
			} else {
				res.status(500).send('Unknown object type: ' + objType);
			}
		} else {
			res.status(403).send(err);
		}
	});
};

/**
 * Sends server-sent-events message to all connected clients that are listening
 * to the changes in the IO that is passed.
 * @param io
 * @param eventName
 * @param data
 */
NodeApiServer.prototype.sendToAll = function (io, eventName, data) {
	var self = this,
		clientArr,
		cleanData,
		res,
		i;

	// Increment the message counter
	io.messageId++;

	clientArr = io.clients;
	cleanData = self.jStringify(data);

	// Loop client resource and write data out to socket
	for (i = 0; i < clientArr.length; i++) {
		res = clientArr[i].res;
		self.sendToClient(res, io.messageId, eventName, cleanData);
	}
};

/**
 * Sends data to individual client.
 * @param res
 * @param messageId
 * @param eventName
 * @param stringifiedData Data to send in already-stringified format.
 */
NodeApiServer.prototype.sendToClient = function (res, messageId, eventName, stringifiedData) {
	res.write('event: ' + eventName + '\n');
	res.write('id: ' + messageId + '\n');
	res.write("data: " + stringifiedData + '\n\n');
};

/**
 * Checks for permission to access the specified object.
 * @param {String} dbName
 * @param {String} objType
 * @param {String} objName
 * @param {String} methodName
 * @param {Object} req
 * @param {Function} callback
 * @returns {*}
 */
NodeApiServer.prototype.hasPermission = function (dbName, objType, objName, methodName, req, callback) {
	var permissionMethods = this._core.api.access(dbName, objType, objName, methodName);

	if (!permissionMethods || !permissionMethods.length) {
		// No permissions set, deny access by default
		return callback('403 Access Forbidden');
	}

	// Add a method right at the beginning of the waterfall
	// that passes in the req object so all the access control
	// methods can analyse the request for info they might need
	permissionMethods.splice(0, 0, function (cb) {
		cb(null, objName, methodName, req);
	});

	// Loop the access methods and call each one in turn until a false
	// response is found, then callback a failure
	async.waterfall(permissionMethods, callback);
};

/**
 * Defines an access rule for a model and method combination. When
 * access is requested via a REST call, the function provided will be
 * executed and the callback from that method will determine if the
 * access will be allowed or denied. Multiple access functions can
 * be provided for a single model and method allowing authentication
 * checks to be stacked.
 * @name access
 * @param {String} dbName The name of the database to set access rules for.
 * @param {String} objType The type of object that the name refers to
 * e.g. collection, view etc.
 * @param {String} objName The model name (collection) to apply the
 * access function to.
 * @param {String} methodName The name of the method to apply the access
 * function to e.g. "insert".
 * @param {Function} checkFunction The function to call when an access attempt
 * is made against the collection. A callback method is passed to this
 * function which should be called after the function has finished
 * processing.
 * @returns {*}
 */
NodeApiServer.prototype.access = function (dbName, objType, objName, methodName, checkFunction) {
	if (objType !== undefined && objName !== undefined && methodName !== undefined) {
		if (checkFunction !== undefined) {
			// Set new access permission with callback "checkFunction"
			_access.db = _access.db || {};
			_access.db[dbName] = _access.db[dbName] || {};
			_access.db[dbName][objType] = _access.db[dbName][objType] || {};
			_access.db[dbName][objType][objName] = _access.db[dbName][objType][objName] || {};
			_access.db[dbName][objType][objName][methodName] = _access.db[dbName][objType][objName][methodName] || [];
			_access.db[dbName][objType][objName][methodName].push(checkFunction);

			return this;
		}

		// Get all checkFunctions for the specified access data
		if (_access.db && _access.db[dbName] && _access.db[dbName][objType] && _access.db[dbName][objType][objName] && _access.db[dbName][objType][objName][methodName]) {
			return [].concat(_access.db[dbName][objType][objName][methodName]);
		}

		if (_access.db && _access.db[dbName] && _access.db[dbName][objType] && _access.db[dbName][objType][objName] && _access.db[dbName][objType][objName]['*']) {
			return [].concat(_access.db[dbName][objType][objName]['*']);
		}

		if (_access.db && _access.db[dbName] && _access.db[dbName][objType] && _access.db[dbName][objType]['*'] && _access.db[dbName][objType]['*'][methodName]) {
			return [].concat(_access.db[dbName][objType]['*'][methodName]);
		}

		if (_access.db && _access.db[dbName] && _access.db[dbName][objType] && _access.db[dbName][objType]['*'] && _access.db[dbName][objType]['*']['*']) {
			return [].concat(_access.db[dbName][objType]['*']['*']);
		}

		if (_access.db && _access.db[dbName] && _access.db[dbName]['*'] && _access.db[dbName]['*']['*'] && _access.db[dbName]['*']['*']['*']) {
			return [].concat(_access.db[dbName]['*']['*']['*']);
		}
	}

	return [];
};

/**
 * Creates the routes that express will expose to clients.
 * @private
 */
NodeApiServer.prototype._defineRoutes = function () {
	var self = this;

	app.get('/', function (req, res) {
		res.send({
			server: 'ForerunnerDB',
			version: self._core.version()
		});
	});

	// Handle sync routes
	app.get('/:dbName/:objType/:objName/_sync', function () { self.handleSyncRequest.apply(self, arguments); });

	// Handle all other routes
	app.get('/:dbName/:objType/:objName', function () { self.handleRequest.apply(self, arguments); });
	app.get('/:dbName/:objType/:objName/:objId', function () { self.handleRequest.apply(self, arguments); });

	app.post('/:dbName/:objType/:objName', function () { self.handleRequest.apply(self, arguments); });
	app.put('/:dbName/:objType/:objName/:objId', function () { self.handleRequest.apply(self, arguments); });
	app.patch('/:dbName/:objType/:objName/:objId', function () { self.handleRequest.apply(self, arguments); });

	app.delete('/:dbName/:objType/:objName', function () { self.handleRequest.apply(self, arguments); });
	app.delete('/:dbName/:objType/:objName/:objId', function () { self.handleRequest.apply(self, arguments); });

	app.get('/:dbName/:objType/:objName/_sync', function () { self.handleRequest.apply(self, arguments); });
	app.get('/:dbName/:objType/:objName/:objId/_sync', function () { self.handleRequest.apply(self, arguments); });
};

/**
 * Override the Core init to instantiate the plugin.
 * @returns {*}
 */
Core.prototype.init = function () {
	this.api = new NodeApiServer(this);
	return CoreInit.apply(this, arguments);
};

Shared.finishModule('NodeApiServer');
module.exports = NodeApiServer;