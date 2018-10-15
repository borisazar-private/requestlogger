const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const port = 3000

const app = express()

var chokidar = require('chokidar')
var watcher = chokidar.watch('./')

watcher.on('ready', function() {
  watcher.on('all', function() {
    console.log("Clearing module cache from server")
    Object.keys(require.cache).forEach(function(id) {
      delete require.cache[id]
    })
  })
})

app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

var output = '';

app.get('/log', (request, response) => {
    this.output = syntaxHighlight(JSON.stringify(request, getCircularReplacer(),4));
    response.render('json', {
      output: this.output
    })
})

app.post('/log', (request, response) => {
    this.output = syntaxHighlight(JSON.stringify(request, getCircularReplacer(),4));
    response.render('json', {
      output: this.output
    })
})

app.get('/', (request, response) => {
  response.render('json', {
    output: this.output
  })
})

app.post('/', (request, response) => {
    var output = syntaxHighlight(JSON.stringify(request, getCircularReplacer(),4));

  response.render('json', {
    output: output
  })
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
