var fdb = new ForerunnerDB(),
	db = fdb.db('geospatialMap'),
	coll = db.collection('cities'),
	map;

function initMap() {
	var result1,
		result2,
		centerPoint = [51.50722, -0.12750],
		sharedGeoHashSolver = new GeoHash();

	initMapLabel();

	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: centerPoint[0],
			lng: centerPoint[1]
		},
		zoom: 5
	});

	// Load the data
	$.getJSON('../unitTests/data/cities.json', function (cityData) {
		coll.ensureIndex({
			lngLat: 1
		}, {
			name: 'cityLatLngIndex',
			type: '2d'
		});

		console.log('Inserting records: ' + cityData.length);

		coll.insert(cityData, function () {
			console.log('Collection record count: ' + coll.count());

			var index = coll.index('cityLatLngIndex'),
				search1Hashes,
				search2Hashes,
				myLatlng,
				marker,
				i,
				geoHash,
				hashLatLng, rectangle, mapLabel, item;

			console.log(index !== undefined, "Check index is available: " + index);
			console.log(index.name() === 'cityLatLngIndex', "Check index is correct name: " + index.name());

			// Query index by distance
			// $near queries are sorted by distance from center point by default
			result1 = coll.find({
				lngLat: {
					$near: {
						$point: [51.50722, -0.12750],
						$maxDistance: 50,
						$distanceUnits: 'miles',
						$distanceField: 'dist',
						$geoHashField: 'geoHash'
					}
				}
			});

			result2 = coll.find({
				lngLat: {
					$near: {
						$point: centerPoint,
						$maxDistance: 100,
						$distanceUnits: 'miles',
						$distanceField: 'dist',
						$geoHashField: 'geoHash'
					}
				}
			});

			console.log(result1);
			console.log(result2);

			search1Hashes = result1.__fdbOp._data.index2d.near.neighbours;
			search2Hashes = result2.__fdbOp._data.index2d.near.neighbours;

			for (i = 0; i < result1.length; i++) {
				item = result1[i];
				myLatlng = new google.maps.LatLng(item.lngLat[0], item.lngLat[1]);

				marker = new google.maps.Marker({
					position: myLatlng,
					label: item.name,
					title: item.name
				}).setMap(map);
			}

			for (i = 0; i < search1Hashes.length; i++) {
				geoHash = search1Hashes[i];
				hashLatLng = sharedGeoHashSolver.decode(geoHash);
				//console.log(hashLatLng.latitude, hashLatLng.longitude);
				myLatlng = new google.maps.LatLng(hashLatLng.latitude[2], hashLatLng.longitude[2]);

				/*marker = new google.maps.Marker({
					position: myLatlng,
					label: geoHash + ' (50)'
				}).setMap(map);*/

				mapLabel = new MapLabel({
					text: geoHash + ' (50)',
					position: myLatlng,
					map: map,
					fontSize: 20,
					align: 'center'
				});

				rectangle = new google.maps.Rectangle({
					strokeColor: '#FF0000',
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: '#FF0000',
					fillOpacity: 0.25,
					map: map,
					bounds: {
						north: hashLatLng.latitude[0],
						south: hashLatLng.latitude[1],
						west: hashLatLng.longitude[0],
						east: hashLatLng.longitude[1]
					}
				});
			}

			for (i = 0; i < search2Hashes.length; i++) {
				geoHash = search2Hashes[i];
				hashLatLng = sharedGeoHashSolver.decode(geoHash);
				//console.log(hashLatLng.latitude, hashLatLng.longitude);
				myLatlng = new google.maps.LatLng(hashLatLng.latitude[2], hashLatLng.longitude[2]);

				/*marker = new google.maps.Marker({
				 position: myLatlng,
				 label: geoHash + ' (50)'
				 }).setMap(map);*/

				mapLabel = new MapLabel({
					text: geoHash + ' (100)',
					position: myLatlng,
					map: map,
					fontSize: 20,
					align: 'center'
				});

				rectangle = new google.maps.Rectangle({
					strokeColor: '#00FF00',
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: '#00FF00',
					fillOpacity: 0.25,
					map: map,
					bounds: {
						north: hashLatLng.latitude[0],
						south: hashLatLng.latitude[1],
						west: hashLatLng.longitude[0],
						east: hashLatLng.longitude[1]
					}
				});
			}
		});
	});
}