var util = require('util'),
	aliasify = require('aliasify'),
	stringify = require('stringify'),
	derequire = require('derequire');

module.exports = function(grunt) {
	grunt.initConfig({
		"jshint": {
			"ForerunnerDB": {
				"files": {
					"src": [
						"js/lib/**/*.js",
						'!js/lib/vendor/*.js'
					]
				}
			}
		},

		qunit: {
			"source": {
				"src": [
					"js/unitTests/source.html"
				]
			},

			"minified": {
				"src": [
					"js/unitTests/minified.html"
				]
			}
		},

		"browserify": {
			"all": {
				src: ["./js/builds/all.js"],
				dest: "./js/dist/fdb-all.js",
				options: {
					verbose: true,
					debug: true,
					transform: [aliasify, stringify(['.html'])],
					plugin: [
						[ "browserify-derequire" ]
					]
				}
			},

			"autobind": {
				src: ["./js/builds/autobind.js"],
				dest: "./js/dist/fdb-autobind.js",
				options: {
					verbose: true,
					debug: true,
					transform: [aliasify, stringify(['.html'])],
					plugin: [
						[ "browserify-derequire" ]
					]
				}
			},

			"core": {
				src: ["./js/builds/core.js"],
				dest: "./js/dist/fdb-core.js",
				options: {
					verbose: true,
					debug: true,
					transform: [aliasify, stringify(['.html'])],
					plugin: [
						[ "browserify-derequire" ]
					]
				}
			},

			"core+persist": {
				src: ["./js/builds/core+persist.js"],
				dest: "./js/dist/fdb-core+persist.js",
				options: {
					verbose: true,
					debug: true,
					transform: [aliasify, stringify(['.html'])],
					plugin: [
						[ "browserify-derequire" ]
					]
				}
			},

			"core+views": {
				src: ["./js/builds/core+views.js"],
				dest: "./js/dist/fdb-core+views.js",
				options: {
					verbose: true,
					debug: true,
					transform: [aliasify, stringify(['.html'])],
					plugin: [
						[ "browserify-derequire" ]
					]
				}
			},

			"legacy": {
				src: ["./js/builds/legacy.js"],
				dest: "./js/dist/fdb-legacy.js",
				options: {
					verbose: true,
					debug: true,
					transform: [aliasify, stringify(['.html'])],
					plugin: [
						[ "browserify-derequire" ]
					]
				}
			}
		},

		"uglify": {
			"all": {
				"files": {
					"./js/dist/fdb-all.min.js": ["./js/dist/fdb-all.js"]
				}
			},

			"autobind": {
				"files": {
					"./js/dist/fdb-autobind.min.js": ["./js/dist/fdb-autobind.js"]
				}
			},

			"core": {
				"files": {
					"./js/dist/fdb-core.min.js": ["./js/dist/fdb-core.js"]
				}
			},

			"core+views": {
				"files": {
					"./js/dist/fdb-core+views.min.js": ["./js/dist/fdb-core+views.js"]
				}
			},

			"core+persist": {
				"files": {
					"./js/dist/fdb-core+persist.min.js": ["./js/dist/fdb-core+persist.js"]
				}
			},

			"legacy": {
				"files": {
					"./js/dist/fdb-legacy.min.js": ["./js/dist/fdb-legacy.js"]
				}
			}
		},

		umd: {
			all: {
				options: {
					src: './js/dist/fdb-all.js',
					globalAlias: 'ForerunnerDB'
				}
			},

			autobind: {
				options: {
					src: './js/dist/fdb-autobind.js',
					globalAlias: 'ForerunnerDB_AutoBind'
				}
			},

			core: {
				options: {
					src: './js/dist/fdb-core.js',
					globalAlias: 'ForerunnerDB'
				}
			},

			"core+views": {
				options: {
					src: './js/dist/fdb-core+views.js',
					globalAlias: 'ForerunnerDB'
				}
			},

			"core+persist": {
				options: {
					src: './js/dist/fdb-core+persist.js',
					globalAlias: 'ForerunnerDB'
				}
			},

			"legacy": {
				options: {
					src: './js/dist/fdb-legacy.js',
					globalAlias: 'ForerunnerDB'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks("grunt-browserify");
	grunt.loadNpmTasks('grunt-umd');

	grunt.registerTask('postfix', 'Fix code for IE.', function () {
		var fs = require('fs-extra');

		var fixFile = function (file) {
			var code = fs.readFileSync('./js/dist/' + file, 'utf8');

			// Replace code that IE8 will die on
			code = code.replace(/\.catch\(/g, "['catch'](");
			code = code.replace(/\.continue\(/g, "['continue'](");
			code = code.replace(/\.delete\(/g, "['delete'](");

			// Write changes
			fs.writeFileSync('./js/dist/' + file, code);

			// Copy the build file to the tests folder
			if (fs.existsSync('./js/unitTests/lib/' + file)) {
				fs.unlinkSync('./js/unitTests/lib/' + file);
			}

			fs.copySync('./js/dist/' + file, './js/unitTests/lib/' + file);
		};

		fixFile('fdb-all.js');
		fixFile('fdb-core.js');
		fixFile('fdb-autobind.js');
		fixFile('fdb-core+persist.js');
		fixFile('fdb-core+views.js');
		fixFile('fdb-legacy.js');
	});

	grunt.registerTask('copy', 'Copy final minified files to test lib.', function () {
		var fs = require('fs-extra');

		var copyFile = function (file) {
			// Copy the build file to the tests folder
			if (fs.existsSync('./js/unitTests/lib/' + file)) {
				fs.unlinkSync('./js/unitTests/lib/' + file);
			}

			fs.copySync('./js/dist/' + file, './js/unitTests/lib/' + file);
		};

		copyFile('fdb-all.min.js');
		copyFile('fdb-autobind.min.js');
		copyFile('fdb-core.min.js');
		copyFile('fdb-core+persist.min.js');
		copyFile('fdb-core+views.min.js');
		copyFile('fdb-legacy.min.js');
	});

	grunt.registerTask('version', 'Increments the current version by a revision', function () {
		var fs = require('fs-extra'),
			packageJson,
			versionString,
			oldVersion,
			versionArr,
			revision,
			fileData;

		fileData = fs.readFileSync('./package.json', {encoding: 'utf8'});
		packageJson = JSON.parse(fileData);

		versionString = packageJson.version;
		oldVersion = versionString;
		versionArr = versionString.split('.');
		revision = parseInt(versionArr[2], 10);

		// Increment revision number
		revision++;

		// Create new string
		versionArr[2] = String(revision);
		versionString = versionArr.join('.');

		// Save JSON
		fileData = fileData.replace(oldVersion, versionString);
		fs.writeFileSync('./package.json', fileData);

		// Search project files for old version and replace
		fileData = fs.readFileSync('./js/lib/Shared.js', {encoding: 'utf8'});
		fileData = fileData.replace(oldVersion, versionString);
		fs.writeFileSync('./js/lib/Shared.js', fileData);

		fileData = fs.readFileSync('./readme.md', {encoding: 'utf8'});
		fileData = fileData.replace(oldVersion, versionString);
		fs.writeFileSync('./readme.md', fileData);
	});

	grunt.registerTask("1: Check & Build Source File", ["2: Check Code Cleanliness", "3: Build Source File"]);
	grunt.registerTask("2: Check Code Cleanliness", ["jshint"]);
	grunt.registerTask("3: Build Source File", ["browserify", "postfix"]);
	grunt.registerTask("4: Minify Distribution Source", ["uglify"]);
	grunt.registerTask("5: Run Unit Tests", ["copy", "qunit"]);
	grunt.registerTask("6: Full Build Cycle", ["version", "jshint", "browserify", "postfix", "uglify", "copy", "qunit"]);

	grunt.registerTask("default", ["qunit"]);
};