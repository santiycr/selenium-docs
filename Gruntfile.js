var _ = require('lodash');

var PORT = 4001;

var templateData = {
  baseUrl: '/',

  commit: process.env.TRAVIS_COMMIT,
  branch: process.env.TRAVIS_BRANCH,
  buildId: process.env.TRAVIS_BUILD_ID
};

module.exports = function (grunt) {
  'use strict';
  
  grunt.initConfig({
    // See https://github.com/CabinJS/grunt-pages to learn about this plugin
    pages: {
      docs: {
        src: 'src/markdown',
        dest: 'dist',
        layout: 'src/layout/post.jade',
        url: '/:title/',
        options: {
          pageSrc: 'src/pages',
          data: templateData,
          sortFunction: function (a, b) {
            return a.index - b.index;
          },
          metadataValidator: function(posts) {
            posts.forEach(function(post) {
              var errorString;
              if (_.isUndefined(post.index) || _.isNaN(parseInt(post.index))) {
                errorString = 'The following doc needs a number `index` property to indicate its position in the nav: ';
              } else {
                var duplicateIndexDocs = _.filter(posts, { index: post.index });
                if (duplicateIndexDocs.length > 1) {
                  errorString = 'The following docs have duplicate `index` properties: ' + _(duplicateIndexDocs).without(post).map('sourcePath') + ' and ';
                } else {
                  return;
                }
              }
              grunt.fail.fatal(errorString + post.sourcePath);
            });
          },
        }
      }
    },
    'link-checker': {
      dev: {
        site: 'localhost',
        options: {
          maxConcurrency: 20,
          initialPort: PORT,
          noFragment: true,  // some fragments work fail although they work in the browser
          callback: function(crawler) {
            crawler.addFetchCondition(function(url) {
                return (url.host === 'localhost' &&
                        url.port === PORT.toString() &&
                        !url.path.match(/jquery\/dist\/cdn\/h.src$/));
            });
          }
        }
      }
    },
    committers: {
      options: {
        sort: 'commits',
        email: true,
        nomerges: true,
        output: 'dist/AUTHORS.md'
      },
    },
    jshint: {
      all: [
        '*.js',
        'src/scripts/*.js',
      ],
      options: {
        jshintrc: true
      }
    },
    copy: {
      scripts: {
        files: [{
          expand: true,
          cwd: 'src',
          dest: 'dist',
          src: ['scripts/**']
        }]
      },
      styles: {
        files: [{
          expand: true,
          cwd: 'src',
          dest: 'dist',
          src: ['styles/**']
        }]
      },
      images: {
        files: [{
          expand: true,
          cwd: 'src',
          dest: 'dist',
          src: [
            'images/**',
          ]
        }]
      },
      misc: {
        files: {
          'dist/favicon.ico': 'src/favicon.ico',
        }
      },
      libs: {
        files: [{
          expand: true,
          cwd: 'node_modules',
          dest: 'dist/vendor',
          src: [
            'zeroclipboard/ZeroClipboard.min.js',
            'zeroclipboard/ZeroClipboard.swf',
            'jquery/dist/cdn/jquery-2.1.1.min.js',
            'bootstrap/dist/js/bootstrap.min.js',
            'bootstrap/dist/css/bootstrap.min.css',
            'bootstrap/dist/fonts/glyphicons-halflings-regular.*',
          ]
        }]
      }
    },
    clean: {
      dist: 'dist'
    },
    open: {
      dist: {
        path: 'http://127.0.0.1:' + PORT
      }
    },
    connect: {
      options: {
        hostname: '0.0.0.0',
        port: PORT,
        base: 'dist',
        livereload: true
      },
      dev: {}
    },
    watch: {
      pages: {
        files: [
          'src/markdown/**',
          'src/layout/**',
          'src/pages/**'
        ],
        tasks: ['pages']
      },
      copyImages: {
        files: [
          'src/images/**',
        ],
        tasks: ['copy:images']
      },
      copyScripts: {
        files: [
          'src/scripts/**'
        ],
        tasks: ['copy:scripts']
      },
      copyStyles: {
        files: [
          'src/styles/**'
        ],
        tasks: ['copy:styles']
      },
      misc: {
        files: ['src/*'],
        tasks: ['copy:misc']
      },
      dist: {
        files: ['dist/**'],
        options: {
          livereload: true
        }
      },
    },
    aws_s3: {
      options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: 'selenium-docs.santi.io',
        differential: true,
        maxRetries: 3
      },
      html: {
        files: [
          {expand: true, cwd: 'dist', src: ['**/*.html'], dest: '', params: {
            CacheControl: 'public, max-age=0',
            Expires: -1
          }}
        ]
      },
      images: {
        files: [
          {expand: true, cwd: 'dist', src: ['images/**/*'], dest: '', params: {
            CacheControl: 'public, max-age=630720000',
            Expires: new Date(Date.now() + 63072000000)
          }},
          {expand: true, cwd: 'dist', src: ['*.ico', '*.txt', '*.png'], dest: '', params: {
            CacheControl: 'public, max-age=0',
            Expires: new Date(Date.now())
          }}
        ]
      },
      scriptsAndStyles: {
        options: {
          ContentEncoding: 'gzip'
        },
        files: [
          {expand: true, cwd: 'dist', src: ['styles/**/*', 'scripts/**/*', 'vendor/**/*'], dest: '', params: {
            CacheControl: 'public, max-age=630720000',
            Expires: new Date(Date.now() + 63072000000),
          }}
        ]
      }
    },
  });
  grunt.registerTask('build', [
    'clean',
    'committers',
    'pages',
    'copy',
  ]);
  grunt.registerTask('server', [
    'build',
    'connect:dev',
    'open',
    'watch'
  ]);
  grunt.registerTask('test', function() {
    var isMaster = (process.env.TRAVIS_BRANCH === 'master' &&
                    process.env.TRAVIS_PULL_REQUEST === 'false');
    var tasks = [
      'jshint',
      'build',
      'connect:dev',
      'link-checker'
    ];
    if (isMaster) {
      tasks.push('aws_s3');
    }
    grunt.task.run(tasks);
  });
  require('load-grunt-tasks')(grunt);
};
