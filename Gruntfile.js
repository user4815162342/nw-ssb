module.exports = function(grunt) {

  grunt.initConfig({
    nodewebkit: {
      options: {
        version: '0.8.3',
        build_dir: './build', // Where the build version of my node-webkit app is saved
        mac: false, // build it for mac
        win: false, // build it for win
        linux32: false, // build it for linux32
        linux64: true, // build it for linux64
      },
      src: './app/**/*' // Your node-webkit app
    },
  });

  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.registerTask('default', ['nodewebkit']);

};