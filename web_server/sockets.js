const ws = require('ws');
const auth = require('../backend/auth.js');
const defines = require('../web_server/defines.js');
const db = require('../backend/db.js');
const wsServer = new ws.Server({ noServer: true })

var sockets_arr = [];

function check_connection_state(ws, username)
{
    if (ws.readyState == ws.CLOSED)
    {
        console.log('wsServer err/close');
        for (var i = 0; i < sockets_arr.length; i++)
        {
            if (sockets_arr[i].ws == ws)
            {
                console.log('wsServer err/close ' + i + ' ' + username);
                sockets_arr.splice(i, 1);
                i--;
                break;
            }
        }
        return false;
    }
    return true;

}


function send_message_to_all_clients(message, username)
{
    for (var i = 0; i < sockets_arr.length; i++)
    {
        check_connection_state(sockets_arr[i].ws, sockets_arr[i].username);

        sockets_arr[i].ws.send(username + ' said: ' + message + "  " + i);
    }
}

function create_ws_connection(httpServer)
{
    httpServer.on('upgrade', (req, socket, head) =>
    {
        let url = req.url.replace('/ws', '');
        let params = new URLSearchParams(url);
        let username = params.get('username');
        let cookie = params.get('cookie');

        let autorizado = auth.login_user_with_cookie(cookie, username);

        console.log(autorizado);
        if (autorizado >= 0)
        {
            wsServer.handleUpgrade(req, socket, head, (ws) =>
            {
                wsServer.emit('connection', ws, req);
                sockets_arr.push({ ws: ws, username: params.get('username') });
            });
            return;
        } else
        {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
    })


    wsServer.on('connection', (ws) =>
    {
        ws.on('message', (message) =>
        {
            console.log(defines.STORE_NAME + ' received: ' + message);
            for (var i = 0; i < sockets_arr.length; i++)
            {
                ///send msgs to db here and call function to send to all clients
                send_message_to_all_clients(message, sockets_arr[i].username);
            }
        });
    });

    wsServer.on('close', (ws) =>
    {
        for (var i = 0; i < sockets_arr.length; i++)
        {
            if (sockets_arr[i].ws == ws)
            {
                sockets_arr.splice(i, 1);
                console.log('wsServer closed ' + i);
                break;
            }
        }
        console.log('wsServer closed');
    });

    wsServer.on('error', (ws) =>
    {
        for (var i = 0; i < sockets_arr.length; i++)
        {
            if (sockets_arr[i].ws == ws)
            {
                sockets_arr.splice(i, 1);
                console.err('wsServer err ' + i);
                console.log('wsServer err ' + i);
                break;
            }
        }
        console.log('wsServer err');
    });
}



module.exports = { create_ws_connection }