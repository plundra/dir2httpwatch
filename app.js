/* Configuration */
var LISTEN_PORT = 8080;
var TARGET_DIR  = "/tmp/files";


/* Dependencies */
var crypto = require("crypto");
var app    = require("http").createServer(handler);
var io     = require("socket.io").listen(app);
var fs     = require("fs");


/* Some global storage */
var files   = [];
var clients = [];


/* Request handler */
function handler (req, res) {
    switch(req.url) {
    case "/":
    case "/index.html":
	fs.readFile(__dirname + "/index.html",
		    function (err, data) {
			if (err) {
			    res.writeHead(500);
			    return res.end("Error loading index.html");
			}
			res.writeHead(200, {"Content-Type": "text/html"});
			res.end(data);
		    });
	break;
    
    case "/client.js":
	fs.readFile(__dirname + "/client.js",
		    function (err, data) {
			if (err) {
			    res.writeHead(500);
			    return res.end("Error loading client.js");
			}
			res.writeHead(200, {"Content-Type": "text/javascript"});
			res.end(data);
		    });
	break;

    default:
	res.writeHead(404);
	res.end("404");
    }
}

/* Shortcut-function */
function md5(data) {
    return crypto.createHash("md5").update(data).digest("hex");
}

/* Add handler for sockets.io-connections */
io.sockets.on("connection", function (socket) {
    clients.push(socket);
    var files_with_hash = [];
    for(var i=0; i < files.length; i++) {
	files_with_hash.push({name: files[i], hash: md5(files[i])});
    }
    
    socket.emit("filelist", { files: files_with_hash });
});

/* Trigger clients to add new element */
function addtoclients(filename) {
    update_clients("add", filename);
}

/* Trigger clients to delete an element */
function delfromclients(filename) {
    update_clients("del", filename);
}

/* Send event to client */
function update_clients(action, filename) {
    for(var i=0; i < clients.length; i++) {
	clients[i].emit(action, { name: filename,
				  hash: md5(filename)
				});
    }
}

/* Target handler for rereader() */
function handleread(err, cur) {
    for(var i=0; i < cur.length; i++) {
	if (files.indexOf(cur[i]) >= 0) // In both lists? Do nothing.
	    continue;
	
	console.log("New: " + cur[i]);
	addtoclients(cur[i]);
    }
    
    for(var i=0; i < files.length; i++) {
	if(cur.indexOf(files[i]) >= 0) // In both lists? Do nothing.
	    continue;
	
	console.log("Gone: " + files[i]);
	delfromclients(files[i]);
    }
    
    files = cur;
    setTimeout(function(){ fs.readdir(TARGET_DIR, handleread); }, 500);
}


/* Populate files before accepting clients */
files = fs.readdirSync(TARGET_DIR);

/* Start our HTTP listener */
app.listen(LISTEN_PORT);

/* Trigger the initial readdir-call */
fs.readdir(TARGET_DIR, handleread);
