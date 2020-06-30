const WebSocket = require("ws");
const wsConnection = new WebSocket.Server({ port: 8080 });

const clients = new Set();

class User {
    constructor(connection) {
        this.connection = connection;
        this._channels = new Set();
        this.name;
    }

    loginChannel(channelName) { this._channels.add(channelName) }

    logoutChannel(channelName) { this._channels.delete(channelName) }

    isLoggedIn(channelName) { return this._channels.has(channelName) }
}

wsConnection.on("connection", ws => {
    const user = new User(ws);
    clients.add(user);

    user.connection.on("message", function (data) {
        const message = JSON.parse(data);

        switch (message.command.toString()) {
            case "login":
                return loginUser(user, message);
            case "logout":
                return logoutUser(user, message);
            case "sendMessage":
                return sendMessageToChannel(message, user);
            case "exitChat":
                return exitUserFromChat(user);
            default:
                user.connection.send(JSON.stringify("Unknown command"));
                return;
        }
    });

    user.connection.on("close", function () {
        clients.delete(user);
    });

});

function exitUserFromChat(user) {
    user.connection.send(JSON.stringify('Youre existing from Chat!'));
    user.connection.close();
    clients.delete(user);
    return;
}

function sendMessageToChannel(message, user) {
    for (let client of clients) {

        if (client.isLoggedIn(message.channel)) {
            client.connection.send(JSON.stringify({
                channel: message.channel,
                username: user.name,
                message: message.message
            }));
        }
    }

    return;
}

function loginUser(user, message) {
    user.name = message.username;
    user.loginChannel(message.channel);
    return;
}

function logoutUser(user, message) {
    let channelUser = message.channel;

    if (user.isLoggedIn(channelUser)) {
        user.logoutChannel(channelUser);
    } else {
        user.connection.send(JSON.stringify('It is not your channel!'));
        return;
    }

    for (let client of clients) {
        if (client.isLoggedIn(channelUser)) {
            client.connection.send(JSON.stringify(`User ${user.name} left channel ${channelUser}`));
        }
    }

    return;
}
