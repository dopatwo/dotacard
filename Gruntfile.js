// Use this file to bundle and minify the game js and css
// Install grunt and it's dependencies listed in package.json
// Run "grunt" in the game root folder

module.exports = function(grunt) {
  grunt.initConfig({
    'pkg': grunt.file.readJSON('package.json'),
    'jshint': {
      all: [
        'package.json',
        'Gruntfile.js',
        'server.js',
        'client/json/**/*.json',
        'client/js/**/*.js'
      ]
    },
    'cssmin': { 
      target: {
        files: [{
          expand: true,
          cwd: 'client/css',
          src: ['*.css'],
          dest: 'client/bundle/css',
          ext: '.min.css'
        }]
      }
    },
    'uglify': {
      options: {
        banner: '// <%= pkg.name %> grunt <%= grunt.template.today("yyyy-mm-dd h:MM:ss TT") %> */\n'
      },
      target: {
        files: [{
          src: 'client/js/game.js',
          dest: 'client/bundle/js/game.min.js',
        },{
          src: 'client/js/*/*.js',
          dest: 'client/bundle/js/after.min.js'
        }]
      }
    },
    'concat': {
      css: {
        src: ['client/browser_modules/**/*.min.css',
              'client/bundle/css/*.min.css'],
        dest: 'client/bundle/game.min.css'
      },
      js: {
        src: ['client/browser_modules/**/*.min.js',
              'client/bundle/js/game.min.js',
              'client/bundle/js/after.min.js'],
        dest: 'client/bundle/game.min.js'
      }
    },
    'clean':  ['client/bundle/js', 'client/bundle/css']
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('default', ['jshint', 'cssmin', 'uglify', 'concat', 'clean']);
};
