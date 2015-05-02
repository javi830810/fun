module.exports = function (grunt) {
/*
 |---------------------------------------------------------------------------------
 |	HELPER METHODS
 |---------------------------------------------------------------------------------
*/
	var _tasks = [];
	var _desc  = null;

	function desc(d) {
		_desc = d || "";
	}

	function task () {
		_tasks.push({name: arguments[0], description:_desc || ""});
		_desc = null;
		grunt.registerTask.apply(grunt, arguments);
	}

	function log () {
		console.log.apply(null, arguments);
	}

/*
 |---------------------------------------------------------------------------------
 |	DEFINE THE HELP TASK TO OUTPUT LIST OF COMMANDS
 |---------------------------------------------------------------------------------
*/
	desc('Show a list of commands');
	task('help', function () {

		log('');
		log('Usage: grunt COMMAND');
		log('');
		log('Commands:');
		log('');
		for (var i=0, l=_tasks.length; i<l; i++) {
			var tn = _tasks[i].name;
			var td = _tasks[i].description;

			while(tn && tn.length < 32) {
				tn += ' ';
			}

			log('  > '+ tn +'# '+ td);
		}

	});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		directives: {
			preview: {
				src:  'source/scripts/preview.js',
				dest: 'content/tmp/preview-main.js'
			},
			sequencer: {
				src:  'source/scripts/sequencer.js',
				dest: 'content/tmp/preview-sequencer.js'
			},
			core: {
				src:  'source/scripts/core.js',
				dest: 'content/tmp/preview-core.js'
			},
			index: {
				src:  'source/scripts/index.js',
				dest: 'content/tmp/preview-index.js'
			},
		},
	//
	//	SASS is used to parse our scss files, and we have two files that need
	//	to be parsed and output into the /tmp folder.
	//
		sass: {
			styles: {
				files: {
					'content/tmp/preview-default.css': 'source/sass/preview-default.scss',
					'content/tmp/preview-index.css': 'source/sass/preview-index.scss'
				}
			}
		},
	//
		uglify: {
			options: {

			},
			preview_scripts: {
				files: {
					'content/scripts/preview-main.min.js': 'content/tmp/preview-main.js',
					'content/scripts/preview-sequencer.min.js': 'content/tmp/preview-sequencer.js',
					'content/scripts/preview-core.min.js': 'content/tmp/preview-core.js',
					'content/scripts/preview-index.min.js': 'content/tmp/preview-index.js',
				}
			}
		},
	//
	//	Use CSSMin to minify our css files (run after sass)
	//
		cssmin: {
			all: {
				files: {
					'content/styles/preview-index.css': 'content/tmp/preview-index.css',
					'content/styles/preview-default.css': 'content/tmp/preview-default.css',
				}
			}
		},
	//
	//	Watch files for changes
	//
		watch: {
			sass: {
				files: ['source/sass/*.scss'],
				tasks: ['sass', 'cssmin']
			},
			preview_scripts: {
				files: ['source/scripts/*.js'],
				tasks: [
						'directives:preview',
						'directives:sequencer',
						'directives:core',
						'directives:index',
						'uglify:preview_scripts']
			}
		}
	});

/*
 |---------------------------------------------------------------------------------
 |	LOAD PLUGINS
 |---------------------------------------------------------------------------------
*/
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-directives');

/*
 |---------------------------------------------------------------------------------
 |	SETUP TASKS
 |---------------------------------------------------------------------------------
*/
	grunt.registerTask('default', ['help']);

	desc('Watch for SASS/JS changes and rebuild (CTRL+C to exit)');
	task('assets:watch', ['watch']);

	desc('Rebuild all assets');
	task('assets:build', ['assets:build:sass', 'assets:build:js']);

	desc('Build and minify SASS files');
	task('assets:build:sass', ['sass', 'cssmin']);

	desc('Build and minify JS files');
	task('assets:build:js', ['directives', 'uglify']);
}
