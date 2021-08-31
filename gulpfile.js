
let projectFolder = require("path").basename(__dirname) //"dist"
let sourceFolder = "src"
let fs = require("fs")

let path = {
  build: {
    html: projectFolder + "/",
    css: projectFolder + "/css/",
    img: projectFolder + "/img/",
    fonts: projectFolder + "/fonts/",
    js: projectFolder + "/js/",
  },
  src: {
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
    css: sourceFolder + "/scss/style.scss",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: sourceFolder + "/fonts/**/*.ttf",
    js: sourceFolder + "/js/script.js",
  },
  watch: {
    html: sourceFolder + "/**/*.html",
    css: sourceFolder + "/scss/**/*.scss",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    js: sourceFolder + "/js/**/*.js",
  },
  clean: "./" + projectFolder + "/",
}

let { src, dest } = require("gulp")
let gulp = require("gulp")
let browsersync = require("browser-sync").create()
let fileinclude = require("gulp-file-include")
let del = require("del")
let scss = require("gulp-sass")(require("sass"))
let autoprefixer = require("gulp-autoprefixer")
let groupMedia = require("gulp-group-css-media-queries")
let cleanCss = require("gulp-clean-css")
let rename = require("gulp-rename")
let uglify = require("gulp-uglify-es").default
let imageMin = require("gulp-imagemin")
let webp = require("gulp-webp")
let webpHtml = require("gulp-webp-html")
let webpCss = require("gulp-webpcss")
let svgSprite = require("gulp-svg-sprite")
let ttf2woff = require("gulp-ttf2woff")
let ttf2woff2 = require("gulp-ttf2woff2")
let fonter = require("gulp-fonter")

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + projectFolder + "/"
    },
    port: 3000,
    notify: false
  })
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webpHtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded"
      })
    )
    .pipe(
      groupMedia()
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 version"],
        cascade: true
      })
    )
    // .pipe(scss().on('error', scss.logError)) работают обе строки
    // .pipe(scss.sync().on('error', scss.logError))
    // scss({ outputStyle: 'expanded' }).on('error', scss.logError) - у автора ролика так
    .pipe(webpCss())
    .pipe(dest(path.build.css)) //выгружаем первый раз
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: ".min.css"
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude()) // script.js - @@include('alert.js')
    .pipe(dest(path.build.js))
    .pipe(
      uglify()
    )
    .pipe(
      rename({
        extname: ".min.js"
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imageMin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false}],
        interlaced: true,
        optimizationLevel: 3 // 0 to 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}
gulp.task('otf2ttf', function () { // запускается отдельно вручную: gulp otf2ttf
  return src([sourceFolder + '/fonts/**/*.otf'])
    .pipe(fonter({
      formats: ["ttf"]
    }))
    .pipe(dest(sourceFolder + "/fonts/"))
})

gulp.task('svgSprite', function () { // запускается отдельно вручную: gulp svgSprite
  return gulp.src([sourceFolder + '/iconsprite/*.svg'])
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: "../icons/icons.svg", // sprite file name
          //example: true
        }
      },
    }))
    .pipe(dest(path.build.img))
})

function fontsStyle(params) {
  let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
  if (file_content === '') {
    fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() { }

function watchFiles(params) {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

function clean(params) {
  return del(path.clean)
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle)
let watch = gulp.parallel(build, watchFiles, browserSync)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch
