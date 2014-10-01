ForerunnerDB.moduleLoaded('View', function () {
	test("Bind - View.on() :: setData from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.setData({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 1, "Insert single document");

		userView.unlink('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Insert from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 1, "Insert single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Update from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var currentName = $('#testTarget').find('#2342').text();
		ok(currentName === 'hello', "Insert single document");

		user.update({
			_id: '2342'
		}, {
			name: "hello2"
		});

		var newName = $('#testTarget').find('#2342').text();
		ok(newName === 'hello2', "Update single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Upsert from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var currentName = $('#testTarget').find('#2342').text();
		ok(currentName === 'hello', "Insert single document");

		user.upsert({
			_id: '2342',
			name: "hello2"
		});

		var newName = $('#testTarget').find('#2342').text();
		ok(newName === 'hello2', "Update single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Remove from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 1, "Insert single document");

		user.remove({
			_id: '2342'
		});

		elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Remove single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View() :: View order is correct after insert", function() {
		base.dbUp();
		base.viewUp();
		base.dataUp();
		base.domUp();

		userView
			.queryOptions({
				$orderBy: {
					name: 1
				}
			}, false)
			.link('#testTarget', {
				template: '<li class="item" data-link="id{:_id}">{^{:name}}</li>'
			});

		user.insert({
			_id: '2342',
			name: "adam"
		});

		user.insert({
			_id: '23432',
			name: "zelda"
		});

		user.insert({
			_id: '2322',
			name: "beta"
		});

		var elems = $('#testTarget').find('.item');

		ok(elems.length === 7, "Insert documents");

		// Check sort order
		ok($(elems[0]).attr('id') === '2342', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '2322', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '2', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '3', "Alphabetical 4");
		ok($(elems[4]).attr('id') === '4', "Alphabetical 5");
		ok($(elems[5]).attr('id') === '5', "Alphabetical 6");
		ok($(elems[6]).attr('id') === '23432', "Alphabetical 7");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View() :: View order is correct after update", function() {
		base.dbUp();
		base.viewUp();
		base.dataUp();
		base.domUp();

		userView
			.queryOptions({
				$orderBy: {
					name: 1
				}
			}, false)
			.link('#testTarget', {
				template: '<li class="item" data-link="id{:_id}">{^{:name}}</li>'
			});

		var elems = $('#testTarget').find('.item');

		ok(elems.length === 4, "Document count");

		// Check sort order
		ok($(elems[0]).attr('id') === '2', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '3', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '4', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '5', "Alphabetical 4");

		user.update({
			_id: '2'
		}, {
			name: 'Zelda'
		});

		elems = $('#testTarget').find('.item');

		ok(elems.length === 4, "Document count");

		// Check sort order
		ok($(elems[0]).attr('id') === '3', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '4', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '5', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '2', "Alphabetical 4");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	// Bind with queries
	test("Bind - View.on() with query :: setData from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.setData({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 1, "Insert single document");

		userView.unlink('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() with query :: Insert from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 1, "Insert single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() with query :: Insert from Collection With Item That Does Not Match View Query", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello333"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 0, "Didn't insert single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() with query :: Update from Collection to outside view query constraints", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var currentName = $('#testTarget').find('#2342').text();
		ok(currentName === 'hello', "Insert single document");

		user.update({
			_id: '2342'
		}, {
			name: "hello2"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Document was removed because it does not match query");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() with query :: Update from Collection to inside view query constraints", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello2"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Doc not in view");

		user.update({
			_id: '2342'
		}, {
			name: "hello"
		});

		elem = $('#testTarget').find('#2342');
		ok(elem.length === 1, "Document is now in view as updated data matches query");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() with query :: Upsert from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var currentName = $('#testTarget').find('#2342').text();
		ok(currentName === 'hello', "Insert single document");

		user.upsert({
			_id: '2342',
			name: "hello2"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Document was removed because it does not match query");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View.on() with query :: Remove from Collection", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.domUp();

		userView.query({
			name: 'hello'
		}).link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 1, "Insert single document");

		user.remove({
			_id: '2342'
		});

		elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Remove single document");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View() with query :: View order is correct after insert", function() {
		base.dbUp();
		base.viewUp();
		base.dataUp();
		base.domUp();

		userView
			.queryOptions({
				$orderBy: {
					name: 1
				}
			}, false)
			.link('#testTarget', {
				template: '<li class="item" data-link="id{:_id}">{^{:name}}</li>'
			});

		user.insert({
			_id: '2342',
			name: "adam"
		});

		user.insert({
			_id: '23432',
			name: "zelda"
		});

		user.insert({
			_id: '2322',
			name: "beta"
		});

		var elems = $('#testTarget').find('.item');

		ok(elems.length === 7, "Insert documents");

		// Check sort order
		ok($(elems[0]).attr('id') === '2342', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '2322', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '2', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '3', "Alphabetical 4");
		ok($(elems[4]).attr('id') === '4', "Alphabetical 5");
		ok($(elems[5]).attr('id') === '5', "Alphabetical 6");
		ok($(elems[6]).attr('id') === '23432', "Alphabetical 7");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View() with query :: View order is correct after update", function() {
		base.dbUp();
		base.viewUp();
		base.dataUp();
		base.domUp();

		userView
			.queryOptions({
				$orderBy: {
					name: 1
				}
			}, false)
			.link('#testTarget', {
				template: '<li class="item" data-link="id{:_id}">{^{:name}}</li>'
			});

		var elems = $('#testTarget').find('.item');

		ok(elems.length === 4, "Document count");

		// Check sort order
		ok($(elems[0]).attr('id') === '2', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '3', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '4', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '5', "Alphabetical 4");

		user.update({
			_id: '2'
		}, {
			name: 'Zelda'
		});

		elems = $('#testTarget').find('.item');

		ok(elems.length === 4, "Document count");

		// Check sort order
		ok($(elems[0]).attr('id') === '3', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '4', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '5', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '2', "Alphabetical 4");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});

	test("Bind - View() with query :: View order is correct after update with query constraint", function() {
		base.dbUp();
		base.viewUp();
		base.dataUp();
		base.domUp();

		// Add an active === false to all user records
		user.update({}, {active: false});

		userView
			.query({
				active: true
			})
			.queryOptions({
				$orderBy: {
					name: 1
				}
			}, false)
			.link('#testTarget', {
				template: '<li class="item" data-link="id{:_id}">{^{:name}}</li>'
			});

		var elems = $('#testTarget').find('.item');

		ok(elems.length === 0, "Document count is zero");

		// Update items one at a time and check for correct order
		user.update({
			_id: '2'
		}, {
			active: true
		});

		elems = $('#testTarget').find('.item');
		ok(elems.length === 1, "Document count is one");

		user.update({
			_id: '4'
		}, {
			active: true
		});

		elems = $('#testTarget').find('.item');
		ok(elems.length === 2, "Document count is two");

		ok($(elems[0]).attr('id') === '4' && $(elems[0]).text() === 'Dean', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '2' && $(elems[1]).text() === 'Jim', "Alphabetical 2");

		user.update({
			_id: '3'
		}, {
			active: true
		});

		elems = $('#testTarget').find('.item');
		ok(elems.length === 3, "Document count is three");

		ok($(elems[0]).attr('id') === '4' && $(elems[0]).text() === 'Dean', "Alphabetical 1");
		ok($(elems[1]).attr('id') === '2' && $(elems[1]).text() === 'Jim', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '3' && $(elems[2]).text() === 'Kat', "Alphabetical 3");

		user.update({
			_id: '5'
		}, {
			active: true
		});

		elems = $('#testTarget').find('.item');
		ok(elems.length === 4, "Document count");

		// Check sort order
		ok($(elems[0]).text() === 'Dean', "Alphabetical 1");
		ok($(elems[1]).text() === 'Dean', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '2' && $(elems[2]).text() === 'Jim', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '3' && $(elems[3]).text() === 'Kat', "Alphabetical 4");

		user.update({
			_id: '2'
		}, {
			name: 'Zelda'
		});

		elems = $('#testTarget').find('.item');
		ok(elems.length === 4, "Document count");

		// Check sort order
		ok($(elems[0]).text() === 'Dean', "Alphabetical 1");
		ok($(elems[1]).text() === 'Dean', "Alphabetical 2");
		ok($(elems[2]).attr('id') === '3' && $(elems[2]).text() === 'Kat', "Alphabetical 3");
		ok($(elems[3]).attr('id') === '2' && $(elems[3]).text() === 'Zelda', "Alphabetical 4");

		base.viewDown();
		base.domDown();
		base.dbDown();
	});
});

ForerunnerDB.moduleLoaded('View, CollectionGroup', function () {
	test("Bind - View.on() :: Insert from CollectionGroup via Collection Interface", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.viewGroupUp();
		base.domUp();

		/*expect(1);
		 start();*/

		user.on('insert', function () {
			ok(true, 'Collection insert');
		});

		userView.on('insert', function () {
			ok(true, 'View insert');
		});

		userGroup.on('insert', function () {
			ok(true, 'Group insert');
		});

		userGroupView.on('insert', function () {
			ok(true, 'View from group insert');
		});

		userGroupView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 1, "Insert single document");

		base.domDown();
		base.viewGroupDown();
		base.viewDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Update from CollectionGroup via Collection Interface", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.viewGroupUp();
		base.domUp();

		user.on('update', function () {
			ok(true, 'Collection update');
		});

		userView.on('update', function () {
			ok(true, 'View update');
		});

		userGroup.on('update', function () {
			ok(true, 'Group update');
		});

		userGroupView.on('update', function () {
			ok(true, 'View from group update');
		});

		userGroupView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var currentName = $('#testTarget').find('#2342').text();
		ok(currentName === 'hello', "Insert single document");

		user.update({
			_id: '2342'
		}, {
			name: "hello2"
		});

		var newName = $('#testTarget').find('#2342').text();
		ok(newName === 'hello2', "Update single document");

		//base.domDown();
		base.viewGroupDown();
		base.viewDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Remove from CollectionGroup via Collection Interface", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.viewGroupUp();
		base.domUp();

		user.on('remove', function () {
			ok(true, 'Collection remove');
		});

		userView.on('remove', function () {
			ok(true, 'View remove');
		});

		userGroup.on('remove', function () {
			ok(true, 'Group remove');
		});

		userGroupView.on('remove', function () {
			ok(true, 'View from group remove');
		});

		userGroupView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		user.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 1, "Insert single document");

		user.remove({
			_id: '2342'
		});

		elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Remove single document");

		base.domDown();
		base.viewGroupDown();
		base.viewDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Insert from CollectionGroup via CollectionGroup Interface", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.viewGroupUp();
		base.domUp();

		/*expect(1);
		 start();*/

		user.on('insert', function () {
			ok(true, 'Collection insert');
		});

		userView.on('insert', function () {
			ok(true, 'View insert');
		});

		userGroup.on('insert', function () {
			ok(true, 'Group insert');
		});

		userGroupView.on('insert', function () {
			ok(true, 'View from group insert');
		});

		userGroupView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		userGroup.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');

		ok(elem.length === 1, "Insert single document");

		base.domDown();
		base.viewGroupDown();
		base.viewDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Update from CollectionGroup via CollectionGroup Interface", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.viewGroupUp();
		base.domUp();

		user.on('update', function () {
			ok(true, 'Collection update');
		});

		userView.on('update', function () {
			ok(true, 'View update');
		});

		userGroup.on('update', function () {
			ok(true, 'Group update');
		});

		userGroupView.on('update', function () {
			ok(true, 'View from group update');
		});

		userGroupView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		userGroup.insert({
			_id: '2342',
			name: "hello"
		});

		var currentName = $('#testTarget').find('#2342').text();
		ok(currentName === 'hello', "Insert single document");

		userGroup.update({
			_id: '2342'
		}, {
			name: "hello2"
		});

		var newName = $('#testTarget').find('#2342').text();
		ok(newName === 'hello2', "Update single document");

		//base.domDown();
		base.viewGroupDown();
		base.viewDown();
		base.dbDown();
	});

	test("Bind - View.on() :: Remove from CollectionGroup via CollectionGroup Interface", function () {
		base.dbUp();
		base.dataUp();
		base.viewUp();
		base.viewGroupUp();
		base.domUp();

		user.on('remove', function () {
			ok(true, 'Collection remove');
		});

		userView.on('remove', function () {
			ok(true, 'View remove');
		});

		userGroup.on('remove', function () {
			ok(true, 'Group remove');
		});

		userGroupView.on('remove', function () {
			ok(true, 'View from group remove');
		});

		userGroupView.link('#testTarget', {
			template: '<li data-link="id{:_id}">{^{:name}}</li>'
		});

		userGroup.insert({
			_id: '2342',
			name: "hello"
		});

		var elem = $('#testTarget').find('#2342');
		ok(elem.length === 1, "Insert single document");

		userGroup.remove({
			_id: '2342'
		});

		elem = $('#testTarget').find('#2342');
		ok(elem.length === 0, "Remove single document");

		base.domDown();
		base.viewGroupDown();
		base.viewDown();
		base.dbDown();
	});
});