const ws = require('ws');
const auth = require('../backend/auth.js');
const defines = require('../web_server/defines.js');
const wsServer = new ws.Server({ noServer: true })

var sockets_arr = [];

function create_ws_connection(httpServer)
{
    httpServer.on('upgrade', (req, socket, head) =>
    {
        let url = req.url.replace('/ws', '');
        let params = new URLSearchParams(url);
        console.log(params.get('username') + ' ' + params.get('cookie'));
        var autorizado = auth.login_user_with_cookie(
            params.get('username'),
            params.get('cookie')
        );
        console.log(autorizado);
        if (autorizado >= 0)
        {
            wsServer.handleUpgrade(req, socket, head, (ws) =>
            {
                wsServer.emit('connection', ws, req);
                sockets_arr.push({ ws: ws, username: params.get('username') });
            });
        } else
        {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    })


    wsServer.on('connection', (ws) =>
    {
        ws.on('message', (message) =>
        {
            console.log('received: ' + message);
            console.log(defines.STORE_NAME)
            for (var i = 0; i < sockets_arr.length; i++)
            {
                sockets_arr[i].ws.send(sockets_arr[i].username + ' said: ' + message);
            }
        });
        ws.send('something');
    });

    wsServer.on('close', () =>
    {
        console.log('wsServer closed');
    });
}



module.exports = { create_ws_connection }