const ws = require('ws');
const auth = require('../backend/auth.js');
const defines = require('../web_server/defines.js');
const db = require('../backend/db.js');
const wsServer = new ws.Server({ noServer: true })

var sockets_arr = [];
var sockets_admin_arr = [];

function check_connection_state(ws, username, admin)
{
    if (admin)
    {
        if (ws.readyState == ws.CLOSED)
        {
            console.log('wsServer err/close');
            for (var i = 0; i < sockets_admin_arr.length; i++)
            {
                if (sockets_admin_arr[i].ws == ws)
                {
                    console.log('wsServer err/close admin ' + i + ' ' + username);
                    sockets_admin_arr.splice(i, 1);
                    i--;
                    break;
                }
            }
            return false;
        }
        return true;
    } else
    {
        if (ws.readyState == ws.CLOSED)
        {
            console.log('wsServer err/close');
            for (var i = 0; i < sockets_arr.length; i++)
            {
                if (sockets_arr[i].ws == ws)
                {
                    console.log('wsServer err/close user' + i + ' ' + username);
                    sockets_arr.splice(i, 1);
                    i--;
                    break;
                }
            }
            return false;
        }
        return true;
    }

}


function send_message_to_all_clients(message, username)
{
    for (var i = 0; i < sockets_arr.length; i++)
    {
        let res = check_connection_state(sockets_arr[i].ws, sockets_arr[i].username, 0);
        if (res == false)
        {
            i--
            continue;
        }
        sockets_arr[i].ws.send(username + ' said: ' + message + "  " + i);
    }

    for (var i = 0; i < sockets_admin_arr.length; i++)
    {
        let res = check_connection_state(sockets_admin_arr[i].ws, sockets_admin_arr[i].username, 1);
        if (res == false)
        {
            i--
            continue;
        }
        sockets_admin_arr[i].ws.send(username + ' said: ' + message + "  " + i);
    }
    db.save_message_on_chat(username, message);
}

function create_ws_connection(httpServer)
{
    httpServer.on('upgrade', (req, socket, head) =>
    {
        let url = req.url.replace('/ws', '');
        let params = new URLSearchParams(url);
        let username = params.get('username');
        let cookie = params.get('cookie');

        for (var i = 0; i < defines.OUR_USERS.length; i++)
        {
            if (defines.OUR_USERS[i].username == username && defines.OUR_USERS[i].password == cookie)
            {
                wsServer.handleUpgrade(req, socket, head, (ws) =>
                {
                    wsServer.emit('connection', ws, req);
                    sockets_admin_arr.push({ ws: ws, username: username });
                });
                console.log('admin connected ' + username);
                return
            }
        }

        let autorizado = auth.login_user_with_cookie(cookie, username);

        console.log(autorizado);
        if (autorizado >= 0)
        {
            wsServer.handleUpgrade(req, socket, head, (ws) =>
            {
                wsServer.emit('connection', ws, req);
                sockets_arr.push({ ws: ws, username: username });
            });
            console.log('user connected ' + username);
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
            let temp_socket = sockets_arr.find((element) => element.ws == ws);
            if (temp_socket != undefined)
            {
                console.log(defines.STORE_NAME + ' received: ' + message + ' from ' + temp_socket.username);
                send_message_to_all_clients(message, temp_socket.username);
                return;
            }
            else
            {
                temp_socket = sockets_admin_arr.find((element) => element.ws == ws);
                if (temp_socket != undefined)
                {
                    console.log(defines.STORE_NAME + ' received: ' + message + ' from ' + temp_socket.username);
                    send_message_to_all_clients(message, temp_socket.username);
                    return;
                }
            }
            console.log('wsServer err');
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