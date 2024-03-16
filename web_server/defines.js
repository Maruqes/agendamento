const STORE_NAME = "Loja 1";

const OUR_USERS = [];
OUR_USERS.push({ username: "our_user0", password: "our_password0" })
OUR_USERS.push({ username: "our_user1", password: "our_password1" })

function CHECK_OUR_USERS(username, password)
{
    for (var i = 0; i < OUR_USERS.length; i++)
    {
        if (OUR_USERS[i].username == username && OUR_USERS[i].password == password)
        {
            return 1;
        }
    }
    return 0;

}

module.exports = { STORE_NAME, CHECK_OUR_USERS, OUR_USERS }