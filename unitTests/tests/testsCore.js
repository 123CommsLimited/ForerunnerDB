test("Init DB", function() {
	buildUp();

	ok(db instanceof ForerunnerDB, "Complete");

	pullDown();
});

test("DB.collection() :: Create Collection", function() {
	buildUp();

	user = db.collection('user');
	organisation = db.collection('organisation');
	ok(user instanceof ForerunnerDB.classes.Collection, "Complete");

	pullDown();
});

test("Collection.setData() :: Single Document Object", function() {
	buildUp();

	user.setData(singleUserObject);
	ok(user.find({_id: '1'})[0], "Complete");
	ok(user.find({_id: '1'})[0].name === 'Sam', "Complete");

	pullDown();
});

test("Collection.remove() :: Remove Single Document via Find", function() {
	buildUp();

	user.setData(singleUserObject);
	ok(user.find({_id: '1'})[0], "Complete");

	var result = user.remove({_id: '1'});
	ok(!user.find({moo: true})[0], "Complete");
	ok(result.length === 1, "Complete");

	pullDown();
});

test("Collection.setData() :: Multiple Documents via Array", function() {
	buildUp();
	buildData();

	count = user.count();
	ok(count === usersData.length, "Complete");
	ok(user.find({_id: '2'})[0], "Complete");
	ok(user.find({_id: '2'})[0].name === 'Jim', "Complete");

	pullDown();
});

test("Collection.remove() :: Remove Multiple Documents via Find Boolean", function() {
	buildUp();
	buildData();

	var result = user.remove({lookup: true});
	ok(!user.find({_id: '2'})[0], "Complete");
	ok(!user.find({_id: '4'})[0], "Complete");
	ok(result.length === 2, "Complete");
	pullDown();
});

test("Collection.insert() :: Check Primary Key Violation is Working", function() {
	buildUp();
	buildData();

	user.remove({lookup: true});
	var result = user.insert(usersData);

	ok(result.inserted.length === 2, "Complete");
	ok(result.failed.length === 1, "Complete");

	pullDown();
});

test("Collection.setData() :: Multiple Records Re-Insert Data", function() {
	buildUp();
	buildData();

	var result = user.setData(usersData);
	count = user.count();
	ok(count === usersData.length, "Complete");
	ok(user.find({_id: '2'})[0], "Complete");
	ok(user.find({_id: '2'})[0].name === 'Jim', "Complete");

	pullDown();
});

test("Collection.find() :: $exists clause true on field that does exist", function() {
	buildUp();
	buildData();

	var result = user.find({name: {
		$exists: true
	}});

	ok(result.length === 3, "Complete");

	pullDown();
});

test("Collection.find() :: $exists clause true on field that does not exist", function() {
	buildUp();
	buildData();

	var result = user.find({doesNotExist: {
		$exists: true
	}});

	ok(result.length === 0, "Complete");

	pullDown();
});

test("Collection.find() :: $exists clause true on field that does exist", function() {
	buildUp();
	buildData();

	user._debug = false;
	var result = user.find({onlyOne: {
		$exists: true
	}});
	user._debug = false;

	ok(result.length === 1, "Complete");

	pullDown();
});

test("Collection.find() :: $exists clause false", function() {
	buildUp();
	buildData();

	user._debug = false;
	var result = user.find({doesNotExist: {
		$exists: false
	}});
	user._debug = false;

	ok(result.length === 3, "Complete");

	pullDown();
});

test("Collection.find() :: $gt clause", function() {
	buildUp();
	buildData();

	var result = user.find({age: {
		$gt: 11
	}});

	ok(result.length === 2, "Complete");

	pullDown();
});

test("Collection.find() :: $gte clause", function() {
	buildUp();
	buildData();

	var result = user.find({age: {
		$gte: 12
	}});

	ok(result.length === 2, "Complete");

	pullDown();
});

test("Collection.find() :: $lt clause", function() {
	buildUp();
	buildData();

	var result = user.find({age: {
		$lt: 12
	}});

	ok(result.length === 1, "Complete");

	pullDown();
});

test("Collection.find() :: $lte clause", function() {
	buildUp();
	buildData();

	var result = user.find({age: {
		$lte: 12
	}});

	ok(result.length === 2, "Complete");

	pullDown();
});

test("Collection.find() :: $gt $lt clause combined", function() {
	buildUp();
	buildData();

	var result = user.find({age: {
		$lt: 13,
		$gt: 5
	}});

	ok(result.length === 1, "Complete");

	pullDown();
});

test("Collection.find() :: $gte $lte clause combined", function() {
	buildUp();
	buildData();

	var result = user.find({age: {
		$lte: 13,
		$gte: 5
	}});

	ok(result.length === 2, "Complete");

	pullDown();
});

test("Collection.find() :: $or clause", function() {
	buildUp();
	buildData();

	var result = user.find({
		$or: [{
			age: 15
		}, {
			name: 'Dean'
		}]
	});

	ok(result.length === 2, "Complete");

	pullDown();
});

test("Collection.find() :: $and clause", function() {
	buildUp();
	buildData();

	var result = user.find({
		$and: [{
			age: 15
		}, {
			name: 'Jim'
		}]
	});

	ok(result.length === 1, "Complete");

	pullDown();
});

test("Collection.find() :: Nested $or clause", function() {
	buildUp();
	buildData();

	var result = user.find({
		log: {
			$or: [{
				val: 1
			}, {
				val: 2
			}]
		}
	});

	ok(result.length === 2, "Complete");

	pullDown();
});

test("Collection.update() :: arrayKey.$ Positional array selector", function() {
	buildUp();
	buildData();

	var before = user.find({
		"arr": {
			"_id": "lsd"
		}
	});
	
	ok(before.length === 1, "Failed in finding document to update!");
	
	var beforeValue;
	
	for (var i = 0; i < before[0].arr.length; i++) {
		if (before[0].arr[i]._id === 'lsd') {
			beforeValue = before[0].arr[i].val;
		}
	}
	
	ok(beforeValue === 1, "Failed in finding document to update!");
	
	var result = user.update({
		"arr": {
			"_id": "lsd"
		}
	}, {
		"arr.$": {
			val: 2
		}
	});

	ok(result.length === 1, "Failed to update document with positional data!");
	
	var after = user.find({
		"arr": {
			"_id": "lsd"
		}
	});
	
	var afterValue;
	
	for (var i = 0; i < after[0].arr.length; i++) {
		if (after[0].arr[i]._id === 'lsd') {
			afterValue = after[0].arr[i].val;
		}
	}
	
	ok(afterValue === 2, "Failed in finding document to update!");

	pullDown();
});

test("Collection.find() :: Options :: Single join", function() {
	buildUp();
	buildData();

	var result = user.find({}, {
		"join": [{
			"organisation": {
				"_id": "orgId",
				"$as": "org",
				"$require": true,
				"$multi": false
			}
		}]
	});
	
	ok(result[0].orgId === result[0].org._id, "Complete");
	ok(result[1].orgId === result[1].org._id, "Complete");
	ok(result[2].orgId === result[2].org._id, "Complete");

	pullDown();
});

test("Collection.find() :: Options :: Single join, array of ids", function() {
	buildUp();
	buildData();

	var result = user.find({}, {
		"join": [{
			"organisation": {
				"_id": "orgId",
				"$as": "org",
				"$require": true,
				"$multi": false
			}
		}, {
			"user": {
				"_id": "friends",
				"$as": "friendData",
				"$require": true,
				"$multi": true
			}
		}]
	});

	ok(result[0].orgId === result[0].org._id, "Complete");
	ok(result[1].orgId === result[1].org._id, "Complete");
	ok(result[2].orgId === result[2].org._id, "Complete");

	ok(result[0].friends[0] === result[0].friendData[0]._id, "Complete");
	ok(result[1].friends[0] === result[1].friendData[0]._id, "Complete");
	ok(result[2].friends[0] === result[2].friendData[0]._id, "Complete");

	pullDown();
});

test("Collection.find() :: Options :: Multi join", function() {
	buildUp();
	buildData();

	var result = user.find({}, {
		"join": [{
			"user": {
				"_id": "friends",
				"$as": "friendData",
				"$require": true,
				"$multi": true
			}
		}]
	});

	ok(result[0].friends[0] === result[0].friendData[0]._id, "Complete");
	ok(result[1].friends[0] === result[1].friendData[0]._id, "Complete");
	ok(result[2].friends[0] === result[2].friendData[0]._id, "Complete");

	pullDown();
});

test("Collection.updateById() :: $push array operator", function() {
	buildUp();
	buildData();

	var before = user.findById("2");
	
	ok(before.arr.length === 2, "Complete");
	
	var result = user.updateById("2", {
		"$push": {
			"arr": {
				_id: 'ahh',
				val: 8
			}
		}
	});
	
	var after = user.findById("2");
	
	ok(after.arr.length === 3, "Complete");

	pullDown();
});

test("Collection.updateById() :: $pull array operator", function() {
	buildUp();
	buildData();

	var before = user.findById("2");
	
	ok(before.arr.length === 3, "Complete");
	
	var result = user.updateById("2", {
		"$pull": {
			"arr": {
				_id: 'ahh'
			}
		}
	});
	
	var after = user.findById("2");
	
	ok(after.arr.length === 2, "Complete");

	pullDown();
});

test("Collection.upsert() :: Insert on upsert call", function() {
	buildUp();
	buildData();

	var before = user.findById("1");

	ok(!before, "Complete");

	var result = user.upsert(singleUserObject);

	ok(result.op === 'insert', "Complete");

	var after = user.findById("1");

	ok(after, "Complete");

	pullDown();
});

test("Collection.upsert() :: Update on upsert call", function() {
	buildUp();
	buildData();

	user.upsert(singleUserObject);
	var before = user.findById("1");

	ok(before, "Complete");

	var copy = JSON.parse(JSON.stringify(singleUserObject));
	copy.updated = true;

	var result = user.upsert(copy);

	ok(result.op === 'update', "Complete");

	var after = user.findById("1");

	ok(after.updated === true, "Complete");

	pullDown();
});

test("Collection.find() :: Options :: Single Sort Argument, Ascending", function() {
	buildUp();
	buildData();

	var result = user.find({}, {
		"sort": {
			"name": 1
		}
	});

	ok(result[0].name === 'Dean', "Complete");
	ok(result[1].name === 'Jim', "Complete");
	ok(result[2].name === 'Kat', "Complete");

	pullDown();
});

test("Collection.find() :: Options :: Single Sort Argument, Descending", function() {
	buildUp();
	buildData();

	var result = user.find({}, {
		"sort": {
			"name": -1
		}
	});

	ok(result[0].name === 'Kat', "Complete");
	ok(result[1].name === 'Jim', "Complete");
	ok(result[2].name === 'Dean', "Complete");

	pullDown();
});

test("Collection.find() :: Options :: Multi Sort Arguments (2 arguments), Ascending, Ascending", function() {
	buildUp();
	buildData();

	var result = organisation.find({
		"$or": [{
			"industry": "construction"
		}, {
			"industry": "it"
		}]
	}, {
		"sort": {
			"industry": 1,
			"profit": 1
		}
	});

	ok(result[0].industry === 'construction' && result[0].profit === 27, "Complete");
	ok(result[1].industry === 'construction' && result[1].profit === 45, "Complete");
	ok(result[2].industry === 'construction' && result[2].profit === 340, "Complete");
	ok(result[3].industry === 'construction' && result[3].profit === 664, "Complete");
	ok(result[4].industry === 'construction' && result[4].profit === 980, "Complete");

	ok(result[5].industry === 'it' && result[5].profit === 135, "Complete");
	ok(result[6].industry === 'it' && result[6].profit === 135, "Complete");
	ok(result[7].industry === 'it' && result[7].profit === 135, "Complete");

	ok(result[8].industry === 'it' && result[8].profit === 200, "Complete");
	ok(result[9].industry === 'it' && result[9].profit === 780, "Complete");

	ok(result[10].industry === 'it' && result[10].profit === 1002, "Complete");
	ok(result[11].industry === 'it' && result[11].profit === 1002, "Complete");
	ok(result[12].industry === 'it' && result[12].profit === 1002, "Complete");

	pullDown();
});

test("Collection.find() :: Options :: Multi Sort Arguments (3 arguments), Ascending, Ascending, Ascending", function() {
	buildUp();
	buildData();

	var result = organisation.find({
		"$or": [{
			"industry": "construction"
		}, {
			"industry": "it"
		}]
	}, {
		"sort": {
			"industry": 1,
			"profit": 1,
			"type": 1
		}
	});

	ok(result[0].industry === 'construction' && result[0].profit === 27, "Profit");
	ok(result[1].industry === 'construction' && result[1].profit === 45, "Profit");
	ok(result[2].industry === 'construction' && result[2].profit === 340, "Profit");
	ok(result[3].industry === 'construction' && result[3].profit === 664, "Profit");
	ok(result[4].industry === 'construction' && result[4].profit === 980, "Profit");

	ok(result[5].industry === 'it' && result[5].profit === 135 && result[5].type === 'beta', "Profit and Type");
	ok(result[6].industry === 'it' && result[6].profit === 135 && result[6].type === 'cappa', "Profit and Type");
	ok(result[7].industry === 'it' && result[7].profit === 135 && result[7].type === 'delta', "Profit and Type");

	ok(result[8].industry === 'it' && result[8].profit === 200 && result[8].type === 'alpha', "Profit and Type");
	ok(result[9].industry === 'it' && result[9].profit === 780 && result[9].type === 'cappa', "Profit and Type");

	ok(result[10].industry === 'it' && result[10].profit === 1002 && result[10].type === 'alpha', "Profit and Type");
	ok(result[11].industry === 'it' && result[11].profit === 1002 && result[11].type === 'gamma', "Profit and Type");
	ok(result[12].industry === 'it' && result[12].profit === 1002 && result[12].type === 'xray', "Profit and Type");

	pullDown();
});

test("Collection.find() :: Options :: Multi Sort Arguments (3 arguments), Ascending, Ascending, Descending", function() {
	buildUp();
	buildData();

	var result = organisation.find({
		"$or": [{
			"industry": "construction"
		}, {
			"industry": "it"
		}]
	}, {
		"sort": {
			"industry": 1,
			"profit": 1,
			"type": -1
		}
	});

	ok(result[0].industry === 'construction' && result[0].profit === 27, "Profit");
	ok(result[1].industry === 'construction' && result[1].profit === 45, "Profit");
	ok(result[2].industry === 'construction' && result[2].profit === 340, "Profit");
	ok(result[3].industry === 'construction' && result[3].profit === 664, "Profit");
	ok(result[4].industry === 'construction' && result[4].profit === 980, "Profit");

	ok(result[5].industry === 'it' && result[5].profit === 135 && result[5].type === 'delta', "Profit and Type");
	ok(result[6].industry === 'it' && result[6].profit === 135 && result[6].type === 'cappa', "Profit and Type");
	ok(result[7].industry === 'it' && result[7].profit === 135 && result[7].type === 'beta', "Profit and Type");

	ok(result[8].industry === 'it' && result[8].profit === 200 && result[8].type === 'alpha', "Profit and Type");
	ok(result[9].industry === 'it' && result[9].profit === 780 && result[9].type === 'cappa', "Profit and Type");

	ok(result[10].industry === 'it' && result[10].profit === 1002 && result[10].type === 'xray', "Profit and Type");
	ok(result[11].industry === 'it' && result[11].profit === 1002 && result[11].type === 'gamma', "Profit and Type");
	ok(result[12].industry === 'it' && result[12].profit === 1002 && result[12].type === 'alpha', "Profit and Type");

	pullDown();
});

test("Collection.find() :: Options :: Multi Sort Arguments (2 arguments), Descending, Descending with Numbers and Booleans", function() {
	buildUp();
	buildData();

	var result = user.find({

	}, {
		"sort": {
			"lookup": 1,
			"age": 1
		}
	});

	console.log(result);

	ok(result[0].name === 'Kat' && result[0].lookup === false, "Name and Lookup");
	ok(result[1].name === 'Dean' && result[1].lookup === true, "Name and Lookup");
	ok(result[2].name === 'Jim' && result[2].lookup === true, "Name and Lookup");

	pullDown();
});
