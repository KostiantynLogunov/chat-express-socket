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
var socket = io.connect('http://localhost:3013/private');


function disconnetRoom() {
    socket.emit('disconnectPrivate');
}

function chooseContact(contact_id, contact_name) {

    // console.log("Convarsation with user.id", contact_id);
    // console.log("Convarsation with user.name", contact_name);
        document.getElementById('historyMsg').innerHTML = '';

    document.getElementById('choosed_contact').innerHTML = contact_name;

    socket.emit('chooseContact', contact_id);
}

$( document ).ready( () => {

    var choosed_contact = null;

    document.getElementById('choosed_contact').innerHTML = '...';

    socket.on('connected', function (msg) {
        console.log(msg);
        // socket.emit('receiveHistory');//запрос на отримання історі смс
    });

    socket.on('privateMessage', addMessage);

    socket.on('privateHistory', messages => {
        // console.log(messages);
        let client = messages.client;
        for (let message of messages.messages) {
            addMessage(message, client);
        }
    });

    $('.chat-message button').on('click', e => {


        choosed_contact =  document.getElementById('choosed_contact').innerHTML;
        console.log(choosed_contact);
        if ( !choosed_contact || (choosed_contact=='...') ) {
            alert('Please Choose a some contact');
            return;
        }
        e.preventDefault();

        var selector = $("textarea[name='message']");
        var messageContent = selector.val().trim();
        // console.log(messageContent);
        if(messageContent !== '') {
            socket.emit('private_msg', messageContent);
            selector.val('');
        } else {
            alert('Please enter a some message...');
            return;
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
                    style="background: ${message.username === client ? 'lightblue' : ''};"                    
                >${message.content}</div>
            </li>`;

        $(html).hide().appendTo('.chat-history ul').slideDown(200);

        $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 100);
    }
});