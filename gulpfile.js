const projectFolder = require("path").basename(__dirname) //"dist"
const sourceFolder = "src"
const fs = require("fs")

const path = {
  build: {
    html: projectFolder + "/",
    css: projectFolder + "/css/",
    img: projectFolder + "/img/",
    fonts: projectFolder + "/fonts/",
    js: projectFolder + "/js/",
  },
  src: {
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
    css: sourceFolder + "/scss/style.sass",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: sourceFolder + "/fonts/**/*.ttf",
    js: sourceFolder + "/js/script.js",
  },
  watch: {
    html: sourceFolder + "/**/*.html",
    css: sourceFolder + "/scss/**/*.sass",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    js: sourceFolder + "/js/**/*.js",
  },
  clean: "./" + projectFolder + "/",
}

const { src, dest } = require("gulp")
const gulp = require("gulp")
const browsersync = require("browser-sync").create()
const fileinclude = require("gulp-file-include")
const del = require("del")
const scss = require("gulp-sass")(require("sass"))
const autoprefixer = require("gulp-autoprefixer")
const groupMedia = require("gulp-group-css-media-queries")
const cleanCss = require("gulp-clean-css")
const rename = require("gulp-rename")
const uglify = require("gulp-uglify-es").default
const imageMin = require("gulp-imagemin")
const webp = require("gulp-webp")
const webpHtml = require("gulp-webp-html")
const webpCss = require("gulp-webpcss")
const svgSprite = require("gulp-svg-sprite")
const ttf2woff = require("gulp-ttf2woff")
const ttf2woff2 = require("gulp-ttf2woff2")
const fonter = require("gulp-fonter")

function browserSync() {
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

function fontsStyle() {
  let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
  if (file_content === '') {
    fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname ='';
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname !== fontname) {
            fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() { }

function watchFiles() {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

function clean() {
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
