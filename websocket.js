let socket = new WebSocket("ws://localhost:8080");

socket.onopen = event => {
    console.log("Connection established", event);
};

socket.onmessage = event => {
    console.log("Message received: ", JSON.parse(event.data));
};

socket.onclose = event => {
    if (event.wasClean) {
        console.log("Closed correct", event.code);
    } else {
        console.log("Closed wrong", event.code);
    }
};