var gulp = require('gulp');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var path = require('path');
var through2 = require('through2');
var teddy = require('gulp-teddy');
var cheerio = require('gulp-cheerio');
var fs = require("fs");
var svg2png = require('gulp-svg2png');
var rename = require('gulp-rename');



var fileList = [];
var cssarray = [];



gulp.task('svgstore', function () {

    fileList = [];
    var iconName, ww, hh;

    function makeFileList(chunk, enc, callback) {
        var fn =  path.basename(chunk.path)
        var extension = path.extname(chunk.path);
        iconName =  fn.slice(0, -extension.length);
        console.log("Icon Name: " + iconName);
        fileList.push(iconName);
        callback(null, chunk);
    }

    return gulp
        .src('src/svgs/*.svg')
        .pipe(svgmin(function (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: false
                    },
                    js2svg: {
                        pretty: true
                    }
                }]
            }
        }))
        .pipe(through2.obj(makeFileList))
        .pipe(cheerio({
          run: function ($, file) {
            $('svg').each(function () {
                var svg_xml = $("<p>").append($(this).clone()).html()
                ww = Math.ceil($(this).attr("width"));
                hh = Math.ceil($(this).attr("height"));
                //console.log(iconName + " - " + ww + "|" + hh);
                svg_xml = svg_xml.replace(/"/g, '\'');
                svg_xml = svg_xml.replace(/%/g, '%25');
                svg_xml = svg_xml.replace(/&/g, '%26');
                svg_xml = svg_xml.replace(/#/g, '%23');       
                svg_xml = svg_xml.replace(/{/g, '%7B');
                svg_xml = svg_xml.replace(/}/g, '%7D');         
                svg_xml = svg_xml.replace(/</g, '%3C');
                svg_xml = svg_xml.replace(/>/g, '%3E');
                cssarray.push({"in":iconName, "w":ww, "h":hh, "svgxml":svg_xml});
            });
          },
          parserOptions: { xmlMode: true }
        }))
        .pipe(svgstore())
        .pipe(rename('spritesheet.svg'))
        .pipe(gulp.dest('dist/svg'));
        
});

gulp.task('copyJS', function() {
   gulp.src('src/js/*.**')
   .pipe(gulp.dest('dist/js'));
});


gulp.task('sprite-html', ['svgstore'], function() {

    return gulp.src(['src/htmltemplate/**/*.html', '!src/templates/**/*.html'])
        .pipe(teddy.compile({
            cssarray
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('svg2png', function () {
    console.log("Making PNGs");
    gulp.src('src/svgs/**/*.svg')
        .pipe(svg2png())
        .pipe(gulp.dest('dist/pngs'));
});

gulp.task('make_css_file', ['svgstore'], function() {
    
    var cssOutput = "";

    for (a=0; a<cssarray.length; a++) {
        var cssline = ".svgsptbg_" + cssarray[a].in + "{\n";
        cssline += "width: " + cssarray[a].w + "px;\n";
        cssline += "height: " + cssarray[a].h + "px;\n";
        cssline += "text-indent: -9999px;\n";

        cssline += "background: url(\"data:image/svg+xml," + cssarray[a].svgxml + "\") no-repeat;\n"
        cssline += "}\n";

        cssline += ".nosvgs .svgsptbg_" + cssarray[a].in + "{\n";
        cssline += "background: url(\"pngs/" + cssarray[a].in + ".png\") no-repeat;\n"
        cssline += "}\n\n";

        cssOutput += cssline;
    }

    fs.writeFile('dist/css/spritesheet.css', cssOutput, console.log("spritesheet.css created!"));
})


gulp.task('make_scss_file', ['svgstore'], function() {
    
    var cssOutput = "";

    for (a=0; a<cssarray.length; a++) {
        var cssline = "@mixin sprite_" + cssarray[a].in + "{\n";
        cssline += "\twidth: " + cssarray[a].w + "px;\n";
        cssline += "\theight: " + cssarray[a].h + "px;\n";
        cssline += "\tbackground: url($" + cssarray[a].in + "_svg) no-repeat;\n";
        cssline += "}\n";

        //cssline += ".nosvgs .svgsptbg_" + cssarray[a].in + "{\n";
        //cssline += "background: url(\"pngs/" + cssarray[a].in + ".png\") no-repeat;\n"
        //cssline += "}\n\n";

        cssOutput += cssline;
    }

    fs.writeFile('dist/scss/_spritesheet.scss', cssOutput, console.log("_spritesheet.scss created!"));

    cssOutput = "";

    for (a=0; a<cssarray.length; a++) {
        var cssline = "$" + cssarray[a].in + "_svg: ";
        cssline += "\"data:image/svg+xml," + cssarray[a].svgxml + "\";\n";
        cssOutput += cssline + "\n";
    }

    fs.writeFile('dist/scss/_spritesheet_vars.scss', cssOutput, console.log("_spritesheet_vars.scss created!"));
})



//Watch task
gulp.task('default', ['svgstore', 'sprite-html', 'copyJS', 'make_css_file', 'make_scss_file', 'svg2png'] ,function() {
    console.log("Default Gulp Task");
});

gulp.task("sass", ['svgstore', 'make_css_file', 'make_scss_file'] ,function() {
    console.log("SASS Only");
});


