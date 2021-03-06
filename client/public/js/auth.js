function response (data) {
    let resp = data.responseText;
    try {
        if (data.message != void (0)) {
            resp = data.message;
        } else {
            resp = JSON.parse(data.responseText);
            resp = resp.message;
        }
    } catch (e) {}
    return resp;
}

$(".logout-btn").on('click', e => {
    e.preventDefault();
    $.ajax({
        url: '/logout',
        type: 'POST',
        data: {},
        success: (res) => {
            alert(response(res));
            location.reload();
        },
        error: (res) => {
            alert(response(res));
        }
    });
});

$( document ).ready( () => {
    var socket = io.connect('http://localhost:3013');
    socket.on('connected', function (msg) {
        console.log(msg);
        socket.emit('receiveHistory');//запрос на отримання історі смс
    });

    socket.on('message', addMessage);

    socket.on('history', messages => {
        // console.log(messages.client);
        let client = messages.client;
        for (let message of messages.messages) {
            addMessage(message, client);
        }
    });

    $('.chat-message button').on('click', e => {
        e.preventDefault();

        var selector = $("textarea[name='message']");
        var messageContent = selector.val().trim();
        // console.log(messageContent);
        if(messageContent !== '') {
            socket.emit('msg', messageContent);
            selector.val('');
        }
    });

    function encodeHTML (str){
        return $('<div />').text(str).html();
    }

    function addMessage(message, client = null) {
        if (message.client) client = message.client;
        message.date      = (new Date(message.date)).toLocaleString();
        message.username  = encodeHTML(message.username);
        message.content   = encodeHTML(message.content);

        var html = `
            <li>
                <div class="message-data">
                    <span class="message-data-name">${message.username === client ? 'Я' : message.username}</span>
                    <span class="message-data-time">${message.date}</span>
                </div>
                <div class="message my-message"
                    dir="auto"
                    style="background: ${message.username === client ? 'blue' : ''};"                    
                >${message.content}</div>
            </li>`;

        $(html).hide().appendTo('.chat-history ul').slideDown(200);

        $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 100);
    }
});