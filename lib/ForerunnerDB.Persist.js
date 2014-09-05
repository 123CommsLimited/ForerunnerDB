(function () {
	var init = (function (DB) {
		// Import external names locally
		var Collection = DB.classes.Collection,
			CollectionDrop = Collection.prototype.drop,
			CollectionGroup = DB.classes.CollectionGroup,
			CollectionInit = Collection.prototype.init,
			DBInit = DB.prototype.init,
			Overload = DB.classes.Overload,
			Persist;

		Persist = function () {
			this.init.apply(this, arguments);
		};

		Persist.prototype.init = function (db) {
			// Check environment
			if (db.isClient()) {
				if (Storage !== undefined) {
					this.mode('localStorage');
				}
			}
		};

		Persist.prototype.mode = function (type) {
			if (type !== undefined) {
				this._mode = type;
				return this;
			}

			return this._mode;
		};

		Persist.prototype.save = function (key, data, callback) {
			var val;

			switch (this.mode()) {
				case 'localStorage':
					if (typeof data === 'object') {
						val = 'json::fdb::' + JSON.stringify(data);
					} else {
						val = 'raw::fdb::' + data;
					}

					localStorage.setItem(key, val);

					if (callback) { callback(false); }
					break;
			}

			if (callback) { callback('No data handler.'); }
		};

		Persist.prototype.load = function (key, callback) {
			var val,
				parts,
				data;

			switch (this.mode()) {
				case 'localStorage':
					val = localStorage.getItem(key);

					if (val) {
						parts = val.split('::fdb::');

						switch (parts[0]) {
							case 'json':
								data = JSON.parse(parts[1]);
								break;

							case 'raw':
								data = parts[1];
								break;
						}

						if (callback) { callback(false, data); }
					}
					break;
			}

			if (callback) { callback('No data handler or unrecognised data type.'); }
		};

		Persist.prototype.drop = function (key, callback) {
			switch (this.mode()) {
				case 'localStorage':
					localStorage.removeItem(key);
					if (callback) { callback(false); }
					break;
			}

			if (callback) { callback('No data handler or unrecognised data type.'); }
		};

		// Extend the Collection prototype with persist methods
		Collection.prototype.drop = function (removePersistent) {
			// Remove persistent storage
			if (removePersistent) {
				if (this._name) {
					if (this._db) {
						// Save the collection data
						this._db.persist.drop(this._name);
					} else {
						if (callback) { callback('Cannot drop a collection\'s persistent storage when the collection is not attached to a database!'); }
						return 'Cannot drop a collection\'s persistent storage when the collection is not attached to a database!';
					}
				} else {
					if (callback) { callback('Cannot drop a collection\'s persistent storage when no name assigned to collection!'); }
					return 'Cannot drop a collection\'s persistent storage when no name assigned to collection!';
				}
			}

			// Call the original method
			CollectionDrop.apply(this);
		};

		Collection.prototype.save = function (callback) {
			if (this._name) {
				if (this._db) {
					// Save the collection data
					this._db.persist.save(this._name, this._data);
				} else {
					if (callback) { callback('Cannot save a collection that is not attached to a database!'); }
					return 'Cannot save a collection that is not attached to a database!';
				}
			} else {
				if (callback) { callback('Cannot save a collection with no assigned name!'); }
				return 'Cannot save a collection with no assigned name!';
			}
		};

		Collection.prototype.load = function (callback) {
			var self = this;

			if (this._name) {
				if (this._db) {
					// Load the collection data
					this._db.persist.load(this._name, function (err, data) {
						if (!err) {
							if (data) {
								self.setData(data);
							}
							if (callback) { callback(false); }
						} else {
							if (callback) { callback(err); }
							return err;
						}
					});
				} else {
					if (callback) { callback('Cannot load a collection that is not attached to a database!'); }
					return 'Cannot load a collection that is not attached to a database!';
				}
			} else {
				if (callback) { callback('Cannot load a collection with no assigned name!'); }
				return 'Cannot load a collection with no assigned name!';
			}
		};

		// Override the DB init to instantiate the plugin
		DB.prototype.init = function () {
			this.persist = new Persist(this);
			DBInit.apply(this, arguments);
		};

		return Persist;
	});

	if (typeof define === 'function' && define.amd) {
		// Use AMD
		define(['require', '../ForerunnerDB'], function (require, ForerunnerDB) {
			return init(ForerunnerDB);
		});
	} else {
		// Use global
		init(ForerunnerDB);
	}
}());