// Import external names locally
var Shared,
	Core,
	CoreInit,
	Collection;

Shared = require('./Shared');

var CollectionGroup = function () {
	this.init.apply(this, arguments);
};

CollectionGroup.prototype.init = function (name) {
	var self = this;

	this._name = name;
	this._data = new Collection('__FDB__cg_data_' + this._name);
	this._collections = [];
	this._views = [];
};

Shared.addModule('CollectionGroup', CollectionGroup);
Shared.inherit(CollectionGroup.prototype, Shared.chainSystem);

Collection = require('./Collection');
Core = Shared.modules.Core;
CoreInit = Shared.modules.Core.prototype.init;

/**
 * Gets / sets debug flag that can enable debug message output to the
 * console if required.
 * @param {Boolean} val The value to set debug flag to.
 * @return {Boolean} True if enabled, false otherwise.
 */
/**
 * Sets debug flag for a particular type that can enable debug message
 * output to the console if required.
 * @param {String} type The name of the debug type to set flag for.
 * @param {Boolean} val The value to set debug flag to.
 * @return {Boolean} True if enabled, false otherwise.
 */
CollectionGroup.prototype.debug = Shared.common.debug;

CollectionGroup.prototype.on = function () {
	this._data.on.apply(this._data, arguments);
};

CollectionGroup.prototype.off = function () {
	this._data.off.apply(this._data, arguments);
};

CollectionGroup.prototype.emit = function () {
	this._data.emit.apply(this._data, arguments);
};

/**
 * Gets / sets the primary key for this collection group.
 * @param {String=} keyName The name of the primary key.
 * @returns {*}
 */
CollectionGroup.prototype.primaryKey = function (keyName) {
	if (keyName !== undefined) {
		this._primaryKey = keyName;
		return this;
	}

	return this._primaryKey;
};

/**
 * Gets / sets the db instance the collection group belongs to.
 * @param {Core=} db The db instance.
 * @returns {*}
 */
Shared.synthesize(CollectionGroup.prototype, 'db');

CollectionGroup.prototype.addCollection = function (collection) {
	if (collection) {
		if (this._collections.indexOf(collection) === -1) {
			var self = this;

			// Check for compatible primary keys
			if (this._collections.length) {
				if (this._primaryKey !== collection.primaryKey()) {
					throw("All collections in a collection group must have the same primary key!");
				}
			} else {
				// Set the primary key to the first collection added
				this.primaryKey(collection.primaryKey());
			}

			// Add the collection
			this._collections.push(collection);
			collection._groups.push(this);
			collection.chain(this);

			// Add collection's data
			this._data.insert(collection.find());
		}
	}

	return this;
};

CollectionGroup.prototype.removeCollection = function (collection) {
	if (collection) {
		var collectionIndex = this._collections.indexOf(collection),
			groupIndex;

		if (collectionIndex !== -1) {
			collection.unChain(this);
			this._collections.splice(collectionIndex, 1);

			groupIndex = collection._groups.indexOf(this);

			if (groupIndex !== -1) {
				collection._groups.splice(groupIndex, 1);
			}
		}

		if (this._collections.length === 0) {
			// Wipe the primary key
			delete this._primaryKey;
		}
	}

	return this;
};

/**
 * Returns a non-referenced version of the passed object / array.
 * @param {Object} data The object or array to return as a non-referenced version.
 * @returns {*}
 */
CollectionGroup.prototype.decouple = Shared.common.decouple;

CollectionGroup.prototype._chainHandler = function (sender, type, data, options) {
	switch (type) {
		case 'setData':
			// Decouple the data to ensure we are working with our own copy
			data = this.decouple(data);

			// Remove old data
			this._data.remove(options.oldData);

			// Add new data
			this._data.insert(data);
			break;

		case 'insert':
			// Decouple the data to ensure we are working with our own copy
			data = this.decouple(data);

			// Add new data
			this._data.insert(data);
			break;

		case 'update':
			// Update data
			this._data.update(data.query, data.update, options);
			break;

		case 'remove':
			this._data.remove(data.query, options);
			break;

		default:
			break;
	}
};

CollectionGroup.prototype.insert = function () {
	this._collectionsRun('insert', arguments);
};

CollectionGroup.prototype.update = function () {
	this._collectionsRun('update', arguments);
};

CollectionGroup.prototype.updateById = function () {
	this._collectionsRun('updateById', arguments);
};

CollectionGroup.prototype.remove = function () {
	this._collectionsRun('remove', arguments);
};

CollectionGroup.prototype._collectionsRun = function (type, args) {
	for (var i = 0; i < this._collections.length; i++) {
		this._collections[i][type].apply(this._collections[i], args);
	}
};

CollectionGroup.prototype.find = function (query, options) {
	return this._data.find(query, options);
};

/**
 * Helper method that removes a document that matches the given id.
 * @param {String} id The id of the document to remove.
 */
CollectionGroup.prototype.removeById = function (id) {
	// Loop the collections in this group and apply the remove
	for (var i = 0; i < this._collections.length; i++) {
		this._collections[i].removeById(id);
	}
};

/**
 * Uses the passed query to generate a new collection with results
 * matching the query parameters.
 *
 * @param query
 * @param options
 * @returns {*}
 */
CollectionGroup.prototype.subset = function (query, options) {
	var result = this.find(query, options);

	return new Collection()
		._subsetOf(this)
		.primaryKey(this._primaryKey)
		.setData(result);
};

/**
 * Drops a collection group from the database.
 * @returns {boolean} True on success, false on failure.
 */
CollectionGroup.prototype.drop = function () {
	var i,
		collArr = [].concat(this._collections),
		viewArr = [].concat(this._views);

	if (this._debug) {
		console.log('Dropping collection group ' + this._name);
	}

	for (i = 0; i < collArr.length; i++) {
		this.removeCollection(collArr[i]);
	}

	for (i = 0; i < viewArr.length; i++) {
		this._removeView(viewArr[i]);
	}

	this.emit('drop');

	return true;
};

// Extend DB to include collection groups
Core.prototype.init = function () {
	this._collectionGroup = {};
	CoreInit.apply(this, arguments);
};

Core.prototype.collectionGroup = function (collectionGroupName) {
	if (collectionGroupName) {
		this._collectionGroup[collectionGroupName] = this._collectionGroup[collectionGroupName] || new CollectionGroup(collectionGroupName).db(this);
		return this._collectionGroup[collectionGroupName];
	} else {
		// Return an object of collection data
		return this._collectionGroup;
	}
};

module.exports = CollectionGroup;