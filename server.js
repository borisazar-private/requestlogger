const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const port = 8000

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
app.use(express.static(path.join(__dirname, 'client/build')));

app.id = ""
app.entry = "";
app.entries = [];

app.post('/log', (request, response) => {
    app.id = new Date().toISOString()
    app.entry = JSON.stringify(request, getCircularReplacer())
    app.entries.push({id: app.id, entry: app.entry});

    response.render('json', {
        id: app.id,
        entry: app.entry,
        entries: app.entries
    })
})

app.get('/get', (request, response) => {
    app.id = request.query.id
    entry = ""

    if (app.id) {
        for (i=0; i < app.entries.length; i++) {
            if (app.entries[i].id == app.id) {
                entry = syntaxHighlight(JSON.stringify(JSON.parse(app.entries[i].entry), getCircularReplacer(), 4))
            }
        }
    }

  response.render('json', {
      id: app.id,
      entry: entry,
      entries: app.entries
  })
})

app.get('/', (request, response) => {
    entry = ""
    if (app.entry) {
        entry = syntaxHighlight(JSON.stringify(JSON.parse(app.entry), getCircularReplacer(), 4))
    }

  response.render('json', {
      id: app.id,
      entry: entry,
      entries: app.entries
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
