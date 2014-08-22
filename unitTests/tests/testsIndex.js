(function () {
	var init = (function (ForerunnerDB, base) {
		test("Index - Collection.ensureIndex() :: Assign an index to a collection", function() {
			base.dbUp();
			base.dataUp();

			var indexResult = user.ensureIndex({
				arr: {
					val: 1
				},
				name: 1
			}, {
				unique: true,
				name: 'testIndex'
			});

			ok(indexResult.err === undefined, "Initialise index: " + indexResult.err);
			ok(indexResult.state !== undefined, "Check index state object: " + indexResult.state);
			ok(indexResult.state.ok === true, "Check index state ok: " + indexResult.state.ok);
			ok(indexResult.state.name === 'testIndex', "Check index state name: " + indexResult.state.name);
		});

		test("Index - Collection.index() :: Test lookup of index from collection by name", function () {
			var index = user.index('testIndex');

			ok(index !== undefined, "Check index is available: " + index);
			ok(index.name !== 'testIndex', "Check index is correct name: " + index.name);
		});

		test("Index - Index.lookup() :: Test index query detection", function () {
			var a = user._analyseQuery({
				arr: {
					val: 5
				},
				name: 'Dean'
			}, {});

			console.log(a);

			ok(a && a.usesIndex && a.usesIndex.length === 1, "Query analyser returned correct number of indexes to use");
			ok(a.usesIndex[0]._name === 'testIndex', "Check index name: " + a.usesIndex[0]._name);
		});

		test("Index - Index.lookup() :: Test lookup from index", function () {
			var index = user.index('testIndex');
			console.log(index);
			var lookup = index.lookup({
				arr: {
					val: 5
				},
				name: 'Dean'
			});

			console.log(lookup);

			ok(lookup.length === 2, "Lookup returned correct number of results");
			ok(lookup[0]._id === '4' && lookup[0].arr[1].val === 5, "Lookup returned correct result 1");
			ok(lookup[1]._id === '5' && lookup[1].arr[1].val === 5, "Lookup returned correct result 2");
		});

		test("Index - Collection.find() :: Test query that should use an index", function () {
			var result = user.find({
				arr: {
					val: 5
				},
				name: 'Dean'
			});

			ok(result && result.length === 2, "Check correct number of results returned");
			ok(result[0]._id === "4", "Check returned data 1 id");
			ok(result[1]._id === "5", "Check returned data 2 id");

			base.dbDown();
		});
	});

	if (typeof(define) === 'function' && define.amd) {
		// Use AMD
		require([
			'../ForerunnerDB',
			'./base'
		], function (ForerunnerDB, base) {
			init(ForerunnerDB, base);
		});
	} else {
		// Use global
		init(ForerunnerDB, base);
	}
})();