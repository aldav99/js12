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
                console.log("---branch---login");
                user.name = message.username;
                user.loginChannel(message.channel);
                console.log(user.name);
                console.log(user._channels);
                return;
            case "logout":
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
            case "sendMessage":
                console.log("---branch---sendMessage");
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
            case "exitChat":
                user.connection.send(JSON.stringify('Youre existing from Chat!'));
                user.connection.close();
                clients.delete(user);
                return;
            default:
                user.connection.send(JSON.stringify("Unknown command"));
                return;
        }
    });

    user.connection.on("close", function () {
        clients.delete(user);
    });

});