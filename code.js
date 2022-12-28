/*** Params ***/
const host = "https://status.vamma.fi/query"
var time = 2000;

var div = document.getElementById("menu");
var header = document.getElementById('header');
var header_c = document.getElementById("server_info");
var games_count = 0;
var info_hidden = false;
var show_players = false;
var active_id = "";
var use_img = 0;

//get available servers
async function loadGames() {
    var response = await fetch(host + '/games')
    var games = await response.json()
    parsegames(games)
  }
async function parsegames(data){
    for(var i of data){
        games_count++;
        writeNavElement(i);
    }
}
// create nav element
function writeNavElement(data){
    var p = document.createElement("h3");
    p.id = data._id;
    p.addEventListener("mouseover", function(){p.style.backgroundColor="rgba(0,0,200,0.6)"; p.style.fontSize="2.5em";});
    p.addEventListener("mouseleave", function(){p.style.backgroundColor=""; p.style.fontSize="2em";});
    p.addEventListener("click", function(){selectGame(p.id);});
    p.style.padding="0.7em 1em 0.7em 1em";
    p.style.display="inline-block";
    p.style.fontSize="2em";
    p.style.color="darkred";
    p.style.cursor = "pointer";
    var text = document.createTextNode(data.game);
    p.appendChild(text);
    div.appendChild(p);
}
// write game name to left info box and choose image to background
async function selectGame(id){
    if(info_hidden){infoVisible();}
    info_hidden = false;
    syncImage(id);
    var response = await fetch(host + '/gamedata/'+id);
    var game = await response.json()
    var Game = game.name;

    if(Game == "undefined" || Game == null || Game == ""){
        var _game = document.getElementById(id);
        Game = _game.innerHTML;
    }
    while(header.hasChildNodes()){
        header.removeChild(header.firstChild);
    }
    
    var p = document.createElement('p');
    var txt = document.createTextNode(Game);
    p.appendChild(txt);
    header.appendChild(p);
    active_id = id;
    getInfo(id);
}
// when no active games write Status to left info box
function writeHeader(){
    var p = document.createElement('p');
    var txt = document.createTextNode("Status");
    p.appendChild(txt);
    header.appendChild(p);
}
// automatically update data to right info box
function infoTimer(id){
    setTimeout(function() {
        if(id == active_id){
            getInfo(id);
        }
    }, time);
}
// get data from backend
async function getInfo(id){
    var response = await fetch(host + '/gamedata/'+id);
    var game = await response.json();
    var status = game.status;
    var ip = game.addres;
    var map = game.map;
    var password = game.password;
    var current_players = game.current_players;
    var max_players = game.max_players;
    var player_names = game.players;
    var version = game.version;

    writeInfo(status, ip, map, password, current_players, max_players, player_names, version);
    infoTimer(id);
}
// write right info box, players or server info
function writeInfo(Status, Addres, Map, Password, c_players, m_players, players, version){
    try{
        while(header_c.hasChildNodes){
            header_c.removeChild(header_c.firstChild);
        }
    }
    catch{}
    if(show_players){

        var icon = document.createElement("i");
        icon.className = "fas fa-angle-right"
        icon.addEventListener("click", function() {
            show_players = false;
            writeInfo(Status, Addres, Map, Password, c_players, m_players, players, version);
        })
        icon.style.float = "right";
        icon.style.cursor = "pointer";
        var p_element = document.createElement("p");
        var p_text = document.createTextNode("Players:");
        p_element.appendChild(p_text);
        header_c.appendChild(icon);
        header_c.appendChild(p_element);
        for(var player of players){
            var element = document.createElement("p");
            var text_node = document.createTextNode(player.name)
            element.appendChild(text_node);
            header_c.appendChild(element);
        }
        header_c.style.width = "20%"
    }
    else{
        var p_status = document.createElement("p");
        var text = document.createTextNode("Status: " + Status);
        if(Status == "Online"){
            p_status.style.color = "Green";
        }
        else{
            p_status.style.color = "Red";
        }
        p_status.appendChild(text);
        var p_ip = document.createElement("p");
        text = document.createTextNode("Addres: " + Addres);
        p_ip.appendChild(text);
        p_ip.addEventListener("click", function(){
            copy(Addres);
            p_ip.className = "tooltip expand";
            p_ip.setAttribute("data-title", "Address copied to clipboard");
            setTimeout(function() {
                p_ip.className = "";
                p_ip.removeAttribute("data-title", "Address copied to clipboard")
            }, 2000);
        })
        p_ip.style.cursor = "pointer";
        var p_version = document.createElement("p");
        text = document.createTextNode("Version: " + version);
        p_version.appendChild(text);
        var p_map = document.createElement("p");
        text = document.createTextNode("Map: " + Map);
        p_map.appendChild(text);
        var p_password = document.createElement("p");
        text = document.createTextNode("Password: " + Password);
        p_password.appendChild(text);
        var p_players = document.createElement("p");
        text = document.createTextNode("Players: " + c_players+"/"+m_players);
        p_players.appendChild(text);

        var icon = document.createElement("i");
        icon.className = "fas fa-angle-left"
        icon.addEventListener("click", function() {
            show_players = true;
            writeInfo(Status, Addres, Map, Password, c_players, m_players, players, version);
        })
        icon.style.float = "right";
        icon.style.cursor = "pointer";

        if(Status == "Online"){
            header_c.appendChild(icon);
            header_c.appendChild(p_status);
            header_c.appendChild(p_map);
            header_c.appendChild(p_ip);
            header_c.appendChild(p_password);
            header_c.appendChild(p_players);
            header_c.appendChild(p_version);
        }
        else{
            header_c.appendChild(p_status);
        }
        }

}
// when client click addres element, copy addres to client clipboard
function copy(Addres){
    navigator.clipboard.writeText(Addres);
}
// if game not selected, hide right info box
function infoVisible(){
    if (header_c.style.display === "none") {
        header_c.style.display = "block";
        info_hidden = false;
      } else {
        header_c.style.display = "none";
        info_hidden = true;
      }
}
// while game not selected change image on background 
function imageTimer(){
    setTimeout(function() {
        use_img++;
        if(info_hidden){
            changeImage();
        }
    }, time);
}
async function changeImage(){
    var response = await fetch(host + '/games')
    var games = await response.json()
    if(use_img>games_count - 1){
        use_img = 0;
    }
    document.getElementById("images").src="./Images/"+games[use_img].image;
    if(info_hidden){
        imageTimer();
    }
}
// when client open game, take background image from that game
async function syncImage(id){
    var response = await fetch(host + '/games')
    var games = await response.json()
    for(var i of games){
        if(i._id == id){
            document.getElementById("images").src="./Images/"+i.image;
        }
    }
}
writeHeader();
changeImage();
infoVisible();
loadGames();