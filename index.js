const express = require('express') 
const cors = require('cors')
const app = express()
const { range } = require('express/lib/request');
const { json } = require('express/lib/response');
const Gamedig = require('gamedig');
app.use(cors())
app.use(express.json())
var servers = [];

/*** Params ***/

const port = 3003
var db_connection_string = 'mongodb+srv://Vamma:<password>@democluster.w0xua.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const db_password = 'password'
const db_collection = 'collection'


// Parse connection string
var db_addpass = db_connection_string.split('<')[0];
var db_addpass_2 = db_connection_string.split('>')[1];
db_connection_string = db_addpass + db_password;
var db_addcollection = db_addpass_2.split('/')[0] + '/' + db_collection + '?' + db_addpass_2.split('/')[1].split('?')[1];
db_connection_string = db_connection_string + db_addcollection;

// Mongo connection
const mongoose = require('mongoose')
const { request, response} = require('express');
const res = require('express/lib/response');
mongoose.connect(db_connection_string, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log("Database " + db_collection + " connected")
})

// Mongo Scheemas
// Server list
const gamesSchema = new mongoose.Schema({
  game: { type: String, required: true },
  type: { type: String, required: true },
  ip: { type: String, required: true },
  port: { type: Number, required: true },
  image: { type: String, required: true }
})
//server data
const gamedataSchema = new mongoose.Schema({
  game: {type: String, required: true},
  status: {type: String},
  map: {type: String},
  addres: {type: String},
  password: {type: Boolean},
  current_players: {type: Number},
  max_players: {type: Number},
  players: {},
  version: {type: String},
  name: {type: String}
})

// models
const Game = mongoose.model('Game', gamesSchema, 'games')
const GameData = mongoose.model('GameData', gamedataSchema, 'gamedata')

// Routes

app.get('/games', async (request, response) => {
  var games = await Game.find({})
  servers = games;
  response.json(games)
})

app.get('/gamedata/:id', async (request, response) => {
  const game = await GameData.findOne({game:request.params.id})
  if (game) {
    response.json(game)
  }
  else response.status(404).end()
})

// app listen port
app.listen(port, () => {
  console.log('App listening on port ' + port)
})

/*****    Gamedig queries and database saves  *****/

// gamedig Server query 
async function queryServer(type, host, port, server){
  var data = await Gamedig.query({
    type: type,
    host: host,
    port: port
  }).then((state) => {
    saveData(state, server);
  }).catch((error) => {
    saveData("offline", server);
  });
}

// save necessary data from query to mongo (because each game gives different queries, we need so much rules here.)
async function saveData(state, server){
  var _game = server._id;
  var _status = "Offline";
  var _map = "";
  var _addres = "";
  var _password = false;
  var _current_players = 0;
  var _max_players = 0;
  var _players = [];
  var _version = "";
  var _name = "";

  if(state != "offline"){
    _game = server._id;
    _status = "Online";
    _map = state.map;
    _addres = state.connect;
    _password = state.password;
    _current_players = state.raw.numplayers;
    _max_players = state.maxplayers;
    _players = state.players;
    _version = state.raw.version;
    _name = state.name;
    if(_version == null){
        _version = state.raw.vanilla.raw.version.name;
    }
    else if(_version == "1.0.0.0"){
        _version = state.raw.tags[0];
    }
    if(_current_players == null){
        _current_players = state.raw.vanilla.raw.players.online;
        _version = state.raw.vanilla.raw.version.name;
    }
    if(server.type == "arkse"){
      _version = state.name.split(" ")[2].split("(")[1].split(")")[0].split("v")[1];
    }
  }
  
  var game = await GameData.findOne({game:server._id});
  //if game data doesnt found from mongo, create new document
  if(game == null){
    var game = new GameData({
        game: _game,
        status: _status,
        map: _map,
        addres: _addres,
        password: _password,
        current_players: _current_players,
        max_players: _max_players,
        players: _players,
        version: _version,
        name: _name
    })
    var saveGame = await game.save();
  }
  else{ // else edit and save old document
    var editGame = await GameData.findOneAndUpdate({game:server._id},{
      status: _status,
      map: _map,
      addres: _addres,
      password: _password,
      current_players: _current_players,
      max_players: _max_players,
      players: _players,
      version: _version,
      name: _name
    })
  }
}
//query all already known servers
async function queryServers(){
  for(var i of servers){
    queryServer(i.type,i.ip,i.port, i);
  }
  autoQuery();
}
// repeat query each minute (with gamedig it takes about 3s to query one server)
function autoQuery(){
  setTimeout(function(){
    //if this app is just opened, get servers from mongo. app automatically update servers list each time when client connect to ui.
    if(servers.length==0){
      GetServers();
    }
    queryServers();
  },60000)
}
// get serverlist from mongo, used by autoquery if serverlist = null
async function GetServers(){
  var games = await Game.find({})
  servers = games;
}
//start autoquery when app is running
autoQuery();