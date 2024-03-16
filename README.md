
# Agendamento
The idea behind this project is a fully working booking app only the backend being on this repo, to get this running is very simple

## Get this running

```
sudo apt install nodejs
sudo apt install npm
git clone https://github.com/Maruqes/agendamento
cd agendamento/web_server/
node web_server.js
```

## API Documentation 

Remember there are a high chance of existing portuguese words is the documentation.
The 'name' sometimes can me taken as the service of the appointment and there are some major variable naming errors, low chance of me fixing that in a near future

## Appointment Related

#### Create a new appointment

```POST
  POST /new
```

| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `name`       | `string`   | The service that you want to book   |
| `email`      | `string`   | The email of the person booking     |
| `user_number`| `string`   | The number of the person booking    |
| `complete_name`| `string` | The complete name of the person booking|
| `user`       | `string`   | The user that the appointment is assigned|
| `date`       | `array`   | The date of the appointment|


#### date array is a json structure with

|dia   | mes   | ano   | hora  | minuto| 
|:-----| :-----| :-----| :-----| :-----|
| day |  month |  year |  hour |  minute|

all of this being strings

#### Edit an appointment

```POST
  POST /edit_marcacao
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `uuid`       | `string`   | The uuid of the appointment   |
| `date`       | `array`   | The date of the appointment|


#### Delete an appointment

```POST
  POST /delete_marcacao
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `uuid`       | `string`   | The uuid of the appointment   |
| `date`       | `array`    | The date of the appointment|



#### Get all appointments

```GET
  GET /get_marcacoes?username=${username}&cookie=${cookie}&user=${user}
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a user   |
| `cookie`       | `string`   | A login cookie from that user   |
| `user`       | `string`   | * if you want all booking or the username of a specifit one   |

## Product Related

#### Create a product
```POST
  POST /create_product
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a admin user |
| `cookie`       | `string`   | A login cookie from that admin user|
| `name`       | `string`   | Name of new product|
| `price`       | `string`   | Price of new product (ex: 20.99)|
| `image`       | `string`   | Image for new product, needs to be uploaded to images folder|
| `duration`       | `string`   | Duration in minutes of new product|
| `description`       | `string`   | Description of new product|


#### Get all products

```GET
  GET /get_products
```

#### Delete a product
```POST
  POST /delete_Product
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a admin user |
| `cookie`       | `string`   | A login cookie from that admin user|
| `name`       | `string`   | Name of the product to be deleted|



#### Edit a product
```POST
  POST /edit_product
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a admin user |
| `cookie`       | `string`   | A login cookie from that admin user|
| `name`       | `string`   | Name of the product|
| `price`       | `string`   | Price of the product (ex: 20.99)|
| `image`       | `string`   | Image of the product, needs to be uploaded to images folder|
| `duration`       | `string`   | Duration in minutes of the product|
| `description`       | `string`   | Description of the product|


## User Related

### Login
```POST
  POST /login
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a user |
| `password`       | `string`   | The password of a user|


### Create a user
```POST
  POST /create_user
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing admin user |
| `cookie`       | `string`   | The password of a existing admin cookie|
| `user`       | `string`   | The new user username|
| `password`       | `string`   | The new user password|
| `user_permission`       | `string`   | The new user permission (0->normal // 1->admin)|
| `email`       | `string`   | The new user email|
| `phone_number`       | `string`   | The new user phone_number|
| `full_name`       | `string`   | The new user full_name|
| `image`       | `string`   | The new user image|

### Edit a user
```POST
  POST /edit_user
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing admin user |
| `cookie`       | `string`   | The password of a existing admin cookie|
| `user`       | `string`   | The edit user username|
| `email`       | `string`   | The edit user email|
| `phone_number`       | `string`   | The edit user phone_number|
| `full_name`       | `string`   | The edit user full_name|
| `image`       | `string`   | The edit user image|

### Delete a user
```POST
  POST /delete_user
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing admin user |
| `cookie`       | `string`   | The password of a existing admin cookie|
| `user`       | `string`   | The username of user being deleted|


### Login with cookie
```POST
  POST /login_cookie
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing user |
| `cookie`       | `string`   | The password of a existing cookie|


#### Get all users
```GET
  GET /get_users?username=${username}&cookie=${cookie}
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a user   |
| `cookie`       | `string`   | A login cookie from that user|

### Logout with cookie
```POST
  POST /logout
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing user |
| `cookie`       | `string`   | The password of a existing cookie|


## Schedules

### Set schedules for appointments
```POST
  POST /set_horario
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing user |
| `cookie`       | `string`   | The password of a existing cookie|
| `dia`       | `int`   | day -> Being 0 Sunday and 6 Saturday |
| `comeco`       | `string`   | Starting hours (ex-> "8:30")|
| `fim`       | `string`   | Ending hours (ex-> "20:15")|

### Get schedules
```GET
  GET /get_horario
```

## Set locks on appointments

Lock can be used for vacation for example, they are certain space of time that there can not be appointments.

### Set locks
```POST
  POST /set_bloqueio
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing user |
| `cookie`       | `string`   | The password of a existing cookie|
| `dia`       | `string`   | day |
| `mes`       | `string`   | month |
| `ano`       | `string`   | year |
| `comeco`       | `string`   | Starting hours (ex-> "8:30")|
| `fim`       | `string`   | Ending hours (ex-> "20:15")|
| `user`       | `string`   | The user in that lock (it can be * for all)|


### Get locks
```GET
  GET /get_bloqueio
```

### Delete locks
```POST
  POST /delete_bloqueio
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing user |
| `cookie`       | `string`   | The password of a existing cookie|
| `uuid`       | `string`   | The uuid of a lock|


## Other

### Reset password
```POST
  POST /start_reset_password
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `email`       | `string`   | The email of the user |


### Reset password
```POST
  POST /change_user_permission
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a existing admin user |
| `cookie`       | `string`   | The password of a existing admin cookie|
| `user`       | `string`   | The user getting permissions changed|
| `permission`       | `string`   | 0->normal // 1->admin|


### Get all database (except password) for statistic purposes
```GET
  GET /get_all_db_data?username=${username}&cookie=${cookie}
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a user   |
| `cookie`       | `string`   | A login cookie from that user|


## Chat
To get the chat working on the front end read this.
This works with WebSockets with a simple login and sendim messages.
The objective is to have support between clients/users/admins with the owner of the product

### First create a WebSocket with
```
let username = "your_user1"
let password = "your_password1"

let url = window.location.href;
url = url.replace("http", "ws")
url = url.replace("chat", "")
url = url + "ws?username=" + username + "&cookie=" + password
console.log(url)
const socket = new WebSocket(url);
```
this passwords can be defined as a normal user/admin or on the defines.js file (owner hosting the server)

### Set some basic functions

```
socket.onopen = function ()
{
    console.log('WebSocket connection established.');
};

socket.onerror = function (error)
{
    console.error('WebSocket error:', error);
};

socket.onclose = function ()
{
    console.log('WebSocket connection closed.');
};
```

### Recieve messages
The message is sent in the following format
```
user/*DIV*/message
```
This happens so you dont have the need of recieving 2 messages woth user and other with the actual message.
Just divide the message where you got /\*DIV\*/
```
socket.onmessage = function (event)
{
    const message = event.data;
    //do something with the message
};
```

### Send messages

```
socket.send('Your Message');
```

On the files we have a /chat.html file sent to **/chat** route for testing purposes


We also have a route to get the messages
### Get messages
```GET
  GET /get_chat_msg?username={username}&cookie={cookie}&number_of_messages={number_of_messages}
```
| Parâmetro    | Tipo       | Descrição                           |
| :----------  | :--------- | :---------------------------------- |
| `username`       | `string`   | The username of a user   |
| `cookie`       | `string`   | A login cookie from that user|
| `number_of_messages`       | `int`   | Number of messages you want starting from the last sent|


[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
