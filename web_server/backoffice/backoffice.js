function getMarcacoes() {
  fetch(
    "/get_marcacoes?cookie=" +
      getCookie("session_token") +
      "&" +
      "username=" +
      getCookie("username")
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function uploadImage() {
  //upload image to server
  var file = document.getElementById("image_input").files[0];
  var formData = new FormData();
  formData.append("image", file);
  formData.append("cookie", getCookie("session_token"));
  formData.append("username", getCookie("username"));
  fetch("/upload", {
    method: "POST",
    body: formData,
  });
}

function createProduct() {
  var name = document.getElementById("name").value;
  var price = document.getElementById("price").value;
  var image = document.getElementById("image_input").value.split("\\").pop();
  console.log(image);
  var duration = document.getElementById("duration").value;
  let data = {
    name: name,
    price: price,
    image: image,
    duration: duration,
    cookie: getCookie("session_token"),
    username: getCookie("username"),
  };
  fetch("/create_product", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

nome = null;

function fazerqualquercoisacomdata(data) {
  nome = data[0].name;
  console.log(nome);
}

function getProducts() {
  fetch("/get_products")
    .then((response) => response.json())
    .then((data) => fazerqualquercoisacomdata(data))
    .catch((error) => console.error("Error:", error));
}

function testzaodavida() {
  console.log(nome);
}

function delete_Product() {
  var name = document.getElementById("delete_Product").value;

  let data = {
    cookie: getCookie("session_token"),
    username: getCookie("username"),

    name: name,
  };

  fetch("/delete_product", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function create_user() {
  var user = document.getElementById("new_name").value;
  var password = document.getElementById("password").value;
  var user_prms = document.getElementById("user_prms").value;

  let data = {
    user: user,
    password: password,
    user_permission: user_prms,
    cookie: getCookie("session_token"),
    username: getCookie("username"),
  };
  fetch("/create_user", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  });
}

function delete_user() {
  var user = document.getElementById("delete_name").value;
  let data = {
    user: user,
    cookie: getCookie("session_token"),
    username: getCookie("username"),
  };
  fetch("/delete_user", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  });
}

function get_users() {
  fetch(
    "/get_users?cookie=" +
      getCookie("session_token") +
      "&" +
      "username=" +
      getCookie("username")
  )
    .then((data) => console.log(data))
    .catch((error) => console.error("Error:", error));
}

async function logout() {
  let data = {
    cookie: getCookie("session_token"),
    username: getCookie("username"),
  };
  await fetch("/logout", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  });
  location.reload();
}
