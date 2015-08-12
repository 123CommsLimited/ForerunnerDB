"use strict";

// TODO: Add doc comments to this class
// Import external names locally
var Shared = require('./Shared'),
	localforage = require('localforage'),
	pako = require('pako'),
	Db,
	Collection,
	CollectionDrop,
	CollectionGroup,
	CollectionInit,
	DbInit,
	DbDrop,
	Persist,
	Overload;

Persist = function () {
	this.init.apply(this, arguments);
};

Persist.prototype.localforage = localforage;

Persist.prototype.init = function (db) {
	// Check environment
	if (db.isClient()) {
		if (window.Storage !== undefined) {
			this.mode('localforage');

			localforage.config({
				driver: [
					localforage.INDEXEDDB,
					localforage.WEBSQL,
					localforage.LOCALSTORAGE
				],
				name: String(db.core().name()),
				storeName: 'FDB'
			});
		}
	}
};

Shared.addModule('Persist', Persist);
Shared.mixin(Persist.prototype, 'Mixin.ChainReactor');

Db = Shared.modules.Db;
Collection = require('./Collection');
CollectionDrop = Collection.prototype.drop;
CollectionGroup = require('./CollectionGroup');
CollectionInit = Collection.prototype.init;
DbInit = Db.prototype.init;
DbDrop = Db.prototype.drop;
Overload = Shared.overload;

Persist.prototype.mode = function (type) {
	if (type !== undefined) {
		this._mode = type;
		return this;
	}

	return this._mode;
};

Persist.prototype.driver = function (val) {
	if (val !== undefined) {
		switch (val.toUpperCase()) {
			case 'LOCALSTORAGE':
				localforage.setDriver(localforage.LOCALSTORAGE);
				break;

			case 'WEBSQL':
				localforage.setDriver(localforage.WEBSQL);
				break;

			case 'INDEXEDDB':
				localforage.setDriver(localforage.INDEXEDDB);
				break;

			default:
				throw('ForerunnerDB.Persist: The persistence driver you have specified is not found. Please use either IndexedDB, WebSQL or LocalStorage!');
		}

		return this;
	}

	return localforage.driver();
};

Persist.prototype.save = function (key, data, callback) {
	var encode;

	encode = function (val, finished) {
		var before,
			after,
			compressedVal;

		if (typeof val === 'object') {
			val = 'json::fdb::' + JSON.stringify(val);
		} else {
			val = 'raw::fdb::' + val;
		}

		// Compress the data
		before = val.length;
		compressedVal = 'c1::' + pako.deflate(val, { to: 'string' });
		after = compressedVal.length;

		// If the compressed version is smaller than the original, use it!
		if (after < before) {
			val = compressedVal;
		}

		if (finished) {
			finished(false, val, {
				foundData: true,
				rowCount: data.length,
				compression: {
					compressedBytes: after,
					uncompressedBytes: before,
					effect: Math.round((100 / before) * after) + '%'
				}
			});
		}
	};

	switch (this.mode()) {
		case 'localforage':
			encode(data, function (err, data, tableStats) {
				localforage.setItem(key, data).then(function (data) {
					if (callback) { callback(false, data, tableStats); }
				}, function (err) {
					if (callback) { callback(err); }
				});
			});
			break;

		default:
			if (callback) { callback('No data handler.'); }
			break;
	}
};

Persist.prototype.load = function (key, callback) {
	var parts,
		data,
		decode;

	decode = function (val, finished) {
		var compressionEnabled = false,
			before,
			after;

		if (val) {
			// Check if we need to decompress the string
			if (val.substr(0, 4) === 'c1::') {
				val = val.substr(4);

				before = val.length;
				val = pako.inflate(val, {to: 'string'});
				after = val.length;

				compressionEnabled = true;
			} else {
				before = after = val.length;
			}

			parts = val.split('::fdb::');

			switch (parts[0]) {
				case 'json':
					data = JSON.parse(parts[1]);
					break;

				case 'raw':
					data = parts[1];
					break;

				default:
					break;
			}

			if (finished) {
				finished(false, data, {
					foundData: true,
					rowCount: data.length,
					compression: {
						enabled: compressionEnabled,
						compressedBytes: before,
						uncompressedBytes: after,
						effect: Math.round((100 / after) * before) + '%'
					}
				});
			}
		} else {
			if (finished) {
				finished(false, val, {
					foundData: false,
					rowCount: 0,
					compression: {
						compressedBytes: 0,
						uncompressedBytes: 0,
						effect: '0%'
					}
				});
			}
		}
	};

	switch (this.mode()) {
		case 'localforage':
			localforage.getItem(key).then(function (val) {
				decode(val, callback);
			}, function (err) {
				if (callback) { callback(err); }
			});
			break;

		default:
			if (callback) { callback('No data handler or unrecognised data type.');	}
			break;
	}
};

Persist.prototype.drop = function (key, callback) {
	switch (this.mode()) {
		case 'localforage':
			localforage.removeItem(key).then(function () {
				if (callback) { callback(false); }
			}, function (err) {
				if (callback) { callback(err); }
			});
			break;

		default:
			if (callback) {
				callback('No data handler or unrecognised data type.');
			}
			break;
	}

};

// Extend the Collection prototype with persist methods
Collection.prototype.drop = new Overload({
	/**
	 * Drop collection and persistent storage.
	 */
	'': function () {
		if (this._state !== 'dropped') {
			this.drop(true);
		}
	},

	/**
	 * Drop collection and persistent storage with callback.
	 * @param {Function} callback Callback method.
	 */
	'function': function (callback) {
		if (this._state !== 'dropped') {
			this.drop(true, callback);
		}
	},

	/**
	 * Drop collection and optionally drop persistent storage.
	 * @param {Boolean} removePersistent True to drop persistent storage, false to keep it.
	 */
	'boolean': function (removePersistent) {
		if (this._state !== 'dropped') {
			// Remove persistent storage
			if (removePersistent) {
				if (this._name) {
					if (this._db) {
						// Drop the collection data from storage
						this._db.persist.drop(this._db._name + '::' + this._name);
						this._db.persist.drop(this._db._name + '::' + this._name + '::metaData');
					} else {
						throw('ForerunnerDB.Persist: Cannot drop a collection\'s persistent storage when the collection is not attached to a database!');
					}
				} else {
					throw('ForerunnerDB.Persist: Cannot drop a collection\'s persistent storage when no name assigned to collection!');
				}
			}

			// Call the original method
			CollectionDrop.apply(this);
		}
	},

	/**
	 * Drop collections and optionally drop persistent storage with callback.
	 * @param {Boolean} removePersistent True to drop persistent storage, false to keep it.
	 * @param {Function} callback Callback method.
	 */
	'boolean, function': function (removePersistent, callback) {
		var self = this;

		if (this._state !== 'dropped') {
			// Remove persistent storage
			if (removePersistent) {
				if (this._name) {
					if (this._db) {
						// Drop the collection data from storage
						this._db.persist.drop(this._db._name + '::' + this._name, function () {
							self._db.persist.drop(self._db._name + '::' + self._name + '::metaData', callback);
						});
					} else {
						if (callback) {
							callback('Cannot drop a collection\'s persistent storage when the collection is not attached to a database!');
						}
					}
				} else {
					if (callback) {
						callback('Cannot drop a collection\'s persistent storage when no name assigned to collection!');
					}
				}
			}

			// Call the original method
			CollectionDrop.apply(this, callback);
		}
	}
});

Collection.prototype.save = function (callback) {
	var self = this;

	if (self._name) {
		if (self._db) {
			// Save the collection data
			self._db.persist.save(self._db._name + '::' + self._name, self._data, function (err, data, tableStats) {
				if (!err) {
					self._db.persist.save(self._db._name + '::' + self._name + '::metaData', self.metaData(), function (err, data, metaStats) {
						if (callback) {
							callback(err, data, tableStats, metaStats);
						}
					});
				} else {
					if (callback) {
						callback(err);
					}
				}
			});
		} else {
			if (callback) {
				callback('Cannot save a collection that is not attached to a database!');
			}
		}
	} else {
		if (callback) {
			callback('Cannot save a collection with no assigned name!');
		}
	}
};

Collection.prototype.load = function (callback) {
	var self = this;

	if (self._name) {
		if (self._db) {
			// Load the collection data
			self._db.persist.load(self._db._name + '::' + self._name, function (err, data, tableStats) {
				if (!err) {
					if (data) {
						self.setData(data);
					}

					// Now load the collection's metadata
					self._db.persist.load(self._db._name + '::' + self._name + '::metaData', function (err, data, metaStats) {
						if (!err) {
							if (data) {
								self.metaData(data);
							}
						}

						if (callback) {
							callback(err, tableStats, metaStats);
						}
					});
				} else {
					if (callback) {
						callback(err);
					}
				}
			});
		} else {
			if (callback) {
				callback('Cannot load a collection that is not attached to a database!');
			}
		}
	} else {
		if (callback) {
			callback('Cannot load a collection with no assigned name!');
		}
	}
};

// Override the DB init to instantiate the plugin
Db.prototype.init = function () {
	DbInit.apply(this, arguments);
	this.persist = new Persist(this);
};

Db.prototype.load = function (callback) {
	// Loop the collections in the database
	var obj = this._collection,
		keys = obj.keys(),
		keyCount = keys.length,
		loadCallback,
		index;

	loadCallback = function (err) {
		if (!err) {
			keyCount--;

			if (keyCount === 0) {
				if (callback) { callback(false); }
			}
		} else {
			if (callback) { callback(err); }
		}
	};

	for (index in obj) {
		if (obj.hasOwnProperty(index)) {
			// Call the collection load method
			obj[index].load(loadCallback);
		}
	}
};

Db.prototype.save = function (callback) {
	// Loop the collections in the database
	var obj = this._collection,
		keys = obj.keys(),
		keyCount = keys.length,
		saveCallback,
		index;

	saveCallback = function (err) {
		if (!err) {
			keyCount--;

			if (keyCount === 0) {
				if (callback) { callback(false); }
			}
		} else {
			if (callback) { callback(err); }
		}
	};

	for (index in obj) {
		if (obj.hasOwnProperty(index)) {
			// Call the collection save method
			obj[index].save(saveCallback);
		}
	}
};

Shared.finishModule('Persist');
module.exports = Persist;