function add_item(text, hash) {
    var newli = document.createElement("li");
    newli.id = hash;
    newli.innerHTML = text;
    document.getElementById("files").appendChild(newli);
    log("Added: <i>" + text + "</i>");
}

function del_item(hash) {
    var item = document.getElementById(hash);
    var text = item.innerHTML;
    item.parentElement.removeChild(item);
    log("Deleted: <i>" + text + "</i>");
}

function log(text) {
    var logs = document.getElementById("logs");
    var date = new Date().toISOString();
    logs.innerHTML = "[" +date + "]: " + text + "\n" + logs.innerHTML;
}

var socket = io.connect();

// Fetch the current filelist
socket.on("filelist", function (data) {
    for(i=0; i < data.files.length; i++) {
	add_item(data.files[i].name, data.files[i].hash);
    }
});

// Item added on server
socket.on("add", function (data) {
    add_item(data.name, data.hash);
});

// Item deleted on server
socket.on("del", function (data) {
    del_item(data.hash);
});

