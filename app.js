(function(){

"use strict";


const KEY = {

  users:"gbao_users",
  products:"gbao_products",
  inventory:"gbao_inventory",
  orders:"gbao_orders",
  session:"gbao_session"

};


function read(key, fallback){

  try{

    const value =
    localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  }catch{

    return fallback;

  }

}


function write(key, value){

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}


function id(){

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


function escape(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


function currentUser(){

  const sid =
  localStorage.getItem(KEY.session);

  if(!sid)return null;

  const users =
  read(KEY.users,[]);

  return users.find(
    u => u.id === sid
  ) || null;

}


function saveUser(user){

  const users =
  read(KEY.users,[]);

  const index =
  users.findIndex(
    u => u.id === user.id
  );

  if(index >= 0)
    users[index] = user;
  else
    users.push(user);

  write(KEY.users,users);

}


function seed(){

  let users =
  read(KEY.users,[]);

  if(!users.length){

    users.push({

      id:id(),
      username:"admin",
      email:"admin@gbao.local",
      password:"admin123",
      role:"admin",
      balance:1000000,
      createdAt:new Date().toISOString()

    });

    write(KEY.users,users);

  }


  let products =
  read(KEY.products,[]);


  if(!products.length){

    products = [

      {
        id:id(),
        name:"IOSVIET",
        game:"Free Fire",
        description:"Tài khoản demo IOSVIET",
        image:"",
        price:50000,
        active:true
      },

      {
        id:id(),
        name:"SUDO",
        game:"Free Fire",
        description:"Tài khoản demo SUDO",
        image:"",
        price:50000,
        active:true
      },

      {
        id:id(),
        name:"MIGUL PRO",
        game:"Free Fire",
        description:"Tài khoản demo MIGUL PRO",
        image:"",
        price:50000,
        active:true
      },

      {
        id:id(),
        name:"MIGUL LITE",
        game:"Free Fire",
        description:"Tài khoản demo MIGUL LITE",
        image:"",
        price:50000,
        active:true
      }

    ];

    write(
      KEY.products,
      products
    );

  }


  if(
    !localStorage.getItem(
      KEY.inventory
    )
  ){

    write(
      KEY.inventory,
      []
    );

  }


  if(
    !localStorage.getItem(
      KEY.orders
    )
  ){

    write(
      KEY.orders,
      []
    );

  }

}


function getProducts(search=""){

  const q =
  String(search)
    .trim()
    .toLowerCase();

  return read(
    KEY.products,
    []
  ).filter(p => {

    if(!p.active)return false;

    if(!q)return true;

    return (
      p.name.toLowerCase().includes(q) ||
      p.game.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );

  });

}


function getAllProducts(){

  return read(
    KEY.products,
    []
  );

}


function getStock(productId){

  return read(
    KEY.inventory,
    []
  ).filter(
    x =>
      x.productId === productId &&
      !x.sold
  ).length;

}


function register(
  username,
  email,
  password
){

  username =
  username.trim();

  email =
  email.trim().toLowerCase();

  if(username.length < 3)
    return {
      ok:false,
      message:"Tên tài khoản tối thiểu 3 ký tự."
    };


  if(password.length < 6)
    return {
      ok:false,
      message:"Mật khẩu tối thiểu 6 ký tự."
    };


  const users =
  read(KEY.users,[]);


  if(
    users.some(
      u =>
        u.email === email
    )
  ){

    return {
      ok:false,
      message:"Email đã tồn tại."
    };

  }


  if(
    users.some(
      u =>
        u.username.toLowerCase()
        === username.toLowerCase()
    )
  ){

    return {
      ok:false,
      message:"Tên tài khoản đã tồn tại."
    };

  }


  const user = {

    id:id(),
    username,
    email,
    password,
    role:"customer",
    balance:0,
    createdAt:
      new Date().toISOString()

  };


  users.push(user);

  write(KEY.users,users);

  localStorage.setItem(
    KEY.session,
    user.id
  );


  return {
    ok:true,
    user
  };

}


function login(
  email,
  password
){

  email =
  email.trim().toLowerCase();


  const users =
  read(KEY.users,[]);


  const user =
  users.find(
    u =>
      u.email === email &&
      u.password === password
  );


  if(!user){

    return {
      ok:false,
      message:"Email hoặc mật khẩu không đúng."
    };

  }


  localStorage.setItem(
    KEY.session,
    user.id
  );


  return {
    ok:true,
    user
  };

}


function logout(){

  localStorage.removeItem(
    KEY.session
  );

}


function buy(productId){

  const user =
  currentUser();


  if(!user){

    return {
      ok:false,
      login:true,
      message:"Bạn cần đăng nhập."
    };

  }


  const products =
  read(KEY.products,[]);


  const product =
  products.find(
    p =>
      p.id === productId &&
      p.active
  );


  if(!product){

    return {
      ok:false,
      message:"Sản phẩm không tồn tại."
    };

  }


  const inventory =
  read(KEY.inventory,[]);


  const item =
  inventory.find(
    x =>
      x.productId === productId &&
      !x.sold
  );


  if(!item){

    return {
      ok:false,
      message:"Sản phẩm đã hết hàng."
    };

  }


  if(user.balance < product.price){

    return {
      ok:false,
      message:
        "Số dư không đủ. Số dư hiện tại: " +
        user.balance.toLocaleString("vi-VN") +
        "đ"
    };

  }


  user.balance -=
  product.price;


  saveUser(user);


  item.sold = true;

  item.soldTo =
  user.id;

  item.soldAt =
  new Date().toISOString();


  write(
    KEY.inventory,
    inventory
  );


  const order = {

    id:id(),
    userId:user.id,
    productId:product.id,
    inventoryId:item.id,
    amount:product.price,
    productName:product.name,
    account:{
      login:item.login,
      password:item.password,
      extra:item.extra || ""
    },
    createdAt:
      new Date().toISOString()

  };


  const orders =
  read(KEY.orders,[]);

  orders.unshift(order);

  write(KEY.orders,orders);


  return {
    ok:true,
    order,
    account:order.account
  };

}


function getOrders(){

  const user =
  currentUser();

  if(!user)return [];

  return read(
    KEY.orders,
    []
  ).filter(
    o =>
      o.userId === user.id
  );

}


function admin(){

  const user =
  currentUser();

  return (
    user &&
    user.role === "admin"
  );

}


function addProduct(data){

  if(!admin())
    throw new Error("Không có quyền.");

  const products =
  read(KEY.products,[]);

  const product = {

    id:id(),
    name:data.name,
    game:data.game,
    description:data.description,
    image:data.image,
    price:Number(data.price),
    active:true

  };

  products.push(product);

  write(
    KEY.products,
    products
  );

  return product;

}


function deleteProduct(productId){

  if(!admin())
    throw new Error("Không có quyền.");

  const products =
  read(KEY.products,[]);

  const product =
  products.find(
    p => p.id === productId
  );

  if(product)
    product.active = false;

  write(
    KEY.products,
    products
  );

}


function addInventory(data){

  if(!admin())
    throw new Error("Không có quyền.");

  const inventory =
  read(KEY.inventory,[]);

  inventory.push({

    id:id(),
    productId:data.productId,
    login:data.login,
    password:data.password,
    extra:data.extra || "",
    sold:false

  });

  write(
    KEY.inventory,
    inventory
  );

}


function getInventory(){

  return read(
    KEY.inventory,
    []
  );

}


function deleteInventory(itemId){

  if(!admin())
    throw new Error("Không có quyền.");

  const inventory =
  read(KEY.inventory,[]);

  const index =
  inventory.findIndex(
    x => x.id === itemId
  );

  if(
    index >= 0 &&
    !inventory[index].sold
  ){

    inventory.splice(index,1);

  }

  write(
    KEY.inventory,
    inventory
  );

}


function addBalance(
  userId,
  amount
){

  if(!admin())
    throw new Error("Không có quyền.");

  amount =
  Number(amount);


  if(
    !Number.isFinite(amount) ||
    amount <= 0
  ){

    throw new Error(
      "Số tiền không hợp lệ."
    );

  }


  const users =
  read(KEY.users,[]);


  const user =
  users.find(
    u => u.id === userId
  );


  if(!user)
    throw new Error(
      "Không tìm thấy người dùng."
    );


  user.balance += amount;

  write(KEY.users,users);

}


function getUsers(){

  if(!admin())
    throw new Error("Không có quyền.");

  return read(
    KEY.users,
    []
  );

}


function renderNav(){

  const box =
  document.getElementById(
    "navUser"
  );

  if(!box)return;


  const user =
  currentUser();


  if(!user){

    box.innerHTML = `

      <a href="login.html">
        <button class="btn gray">
          Đăng nhập
        </button>
      </a>

      <a href="register.html">
        <button class="btn purple">
          Đăng ký
        </button>
      </a>

    `;

    return;

  }


  box.innerHTML = `

    <span class="user">
      👤 ${escape(user.username)}
      <br>
      💰 ${user.balance.toLocaleString("vi-VN")}đ
    </span>

    <a href="orders.html">
      <button class="btn gray">
        📦 Đơn hàng
      </button>
    </a>

    ${
      user.role === "admin"
      ?
      `
      <a href="admin.html">
        <button class="btn purple">
          👑 Admin
        </button>
      </a>
      `
      :
      ""
    }

    <button
      class="btn red"
      onclick="GBAO.logout()">

      Thoát

    </button>

  `;

}


window.GBAO = {

  getUser:currentUser,
  register,
  login,
  logout(){
    logout();
    location.href =
      "index.html";
  },

  getProducts,
  getAllProducts,
  getStock,
  buy,
  getOrders,

  isAdmin:admin,

  addProduct,
  deleteProduct,

  addInventory,
  getInventory,
  deleteInventory,

  addBalance,
  getUsers,

  renderNav,
  escape

};


seed();

})();