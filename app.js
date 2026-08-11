(function(){

"use strict";


const KEYS = {

  users: "gbao_users",

  products: "gbao_products",

  inventory: "gbao_inventory",

  orders: "gbao_orders",

  session: "gbao_session"

};


function read(key, fallback){

  try{

    const value =
      localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  }catch(e){

    return fallback;

  }

}


function write(key,value){

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}


function id(){

  return Date.now().toString(36)
    +
    Math.random()
      .toString(36)
      .substring(2,8);

}


function money(value){

  return Number(value || 0)
    .toLocaleString("vi-VN")
    + "đ";

}


/* =========================
   KHỞI TẠO
========================= */

function init(){

  let users =
    read(KEYS.users,[]);

  let products =
    read(KEYS.products,[]);

  let inventory =
    read(KEYS.inventory,[]);

  let orders =
    read(KEYS.orders,[]);


  if(!products.length){

    products = [

      {
        id:id(),
        name:"IOSVIET",
        price:50000,
        active:true
      },

      {
        id:id(),
        name:"SUDO",
        price:50000,
        active:true
      },

      {
        id:id(),
        name:"MIGUL PRO",
        price:50000,
        active:true
      },

      {
        id:id(),
        name:"MIGUL LITE",
        price:50000,
        active:true
      }

    ];

    write(
      KEYS.products,
      products
    );

  }


  const adminExists =
    users.some(
      u => u.role === "admin"
    );


  if(!adminExists){

    users.push({

      id:id(),

      username:"admin",

      email:"admin@gbao.local",

      password:"admin123",

      role:"admin",

      balance:0

    });

    write(
      KEYS.users,
      users
    );

  }

}


init();


const GBAO = {


/* =========================
   USER
========================= */

getUsers(){

  return read(
    KEYS.users,
    []
  );

},


getUser(){

  const session =
    localStorage.getItem(
      KEYS.session
    );

  if(!session)
    return null;

  const users =
    this.getUsers();

  return users.find(
    u => u.id === session
  ) || null;

},


register(
  username,
  email,
  password
){

  username =
    String(username || "")
      .trim();

  email =
    String(email || "")
      .trim()
      .toLowerCase();

  password =
    String(password || "");


  if(
    !username ||
    !email ||
    !password
  ){

    return {
      ok:false,
      message:"Vui lòng nhập đầy đủ thông tin."
    };

  }


  if(password.length < 6){

    return {
      ok:false,
      message:"Mật khẩu phải có ít nhất 6 ký tự."
    };

  }


  const users =
    this.getUsers();


  if(
    users.some(
      u => u.email === email
    )
  ){

    return {
      ok:false,
      message:"Email đã được đăng ký."
    };

  }


  const user = {

    id:id(),

    username,

    email,

    password,

    role:"user",

    balance:0

  };


  users.push(user);

  write(
    KEYS.users,
    users
  );


  localStorage.setItem(
    KEYS.session,
    user.id
  );


  return {
    ok:true
  };

},


login(email,password){

  email =
    String(email || "")
      .trim()
      .toLowerCase();


  const users =
    this.getUsers();


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
    KEYS.session,
    user.id
  );


  return {
    ok:true
  };

},


logout(){

  localStorage.removeItem(
    KEYS.session
  );

  location.href =
    "index.html";

},


renderUserBox(){

  const box =
    document.getElementById(
      "userBox"
    );

  if(!box)
    return;


  const user =
    this.getUser();


  if(!user){

    box.innerHTML =
      `<a href="login.html">Đăng nhập</a>`;

    return;

  }


  box.innerHTML = `

    <span>
      👤 ${this.escape(
        user.username
      )}
      |
      ${money(user.balance)}
    </span>

    <button
      class="btn"
      style="width:auto;margin:0 0 0 8px"
      onclick="GBAO.logout()">

      Thoát

    </button>

  `;

},


/* =========================
   PRODUCTS
========================= */

getProducts(){

  return read(
    KEYS.products,
    []
  );

},


addProduct(name,price){

  const products =
    this.getProducts();


  products.push({

    id:id(),

    name:name,

    price:Number(price),

    active:true

  });


  write(
    KEYS.products,
    products
  );

},


/* =========================
   INVENTORY
========================= */

getInventory(){

  return read(
    KEYS.inventory,
    []
  );

},


addKey(
  productId,
  duration,
  key
){

  const inventory =
    this.getInventory();


  inventory.push({

    id:id(),

    productId,

    duration:Number(duration),

    key:String(key),

    sold:false,

    createdAt:
      new Date().toISOString()

  });


  write(
    KEYS.inventory,
    inventory
  );

},


getStock(
  productId,
  duration
){

  const inventory =
    this.getInventory();


  return inventory.filter(
    item =>
      item.productId === productId &&
      Number(item.duration) === Number(duration) &&
      !item.sold
  ).length;

},


/* =========================
   PURCHASE
========================= */

buy(
  productId,
  duration
){

  const user =
    this.getUser();


  if(!user){

    alert(
      "Bạn cần đăng nhập trước."
    );

    location.href =
      "login.html";

    return;

  }


  const products =
    this.getProducts();


  const product =
    products.find(
      p =>
        p.id === productId &&
        p.active
    );


  if(!product){

    alert(
      "Sản phẩm không tồn tại."
    );

    return;

  }


  const inventory =
    this.getInventory();


  const item =
    inventory.find(
      i =>
        i.productId === productId &&
        Number(i.duration) === Number(duration) &&
        !i.sold
    );


  if(!item){

    alert(
      "Loại key này hiện đã hết hàng."
    );

    return;

  }


  if(
    Number(user.balance)
    <
    Number(product.price)
  ){

    alert(
      "Số dư không đủ."
    );

    return;

  }


  const users =
    this.getUsers();


  const index =
    users.findIndex(
      u => u.id === user.id
    );


  users[index].balance -=
    Number(product.price);


  item.sold = true;

  item.soldAt =
    new Date().toISOString();

  item.buyerId =
    user.id;


  const orders =
    read(
      KEYS.orders,
      []
    );


  const order = {

    id:id(),

    userId:user.id,

    productId,

    productName:
      product.name,

    duration:Number(duration),

    price:Number(product.price),

    key:item.key,

    createdAt:
      new Date().toISOString()

  };


  orders.push(order);


  write(
    KEYS.users,
    users
  );

  write(
    KEYS.inventory,
    inventory
  );

  write(
    KEYS.orders,
    orders
  );


  alert(
    "Mua thành công!\n\n" +
    "Sản phẩm: " +
    product.name +
    "\nThời hạn: " +
    duration +
    " ngày\n\n" +
    "KEY:\n" +
    item.key
  );


  location.reload();

},


/* =========================
   RENDER PRODUCTS
========================= */

renderProducts(){

  const container =
    document.getElementById(
      "products"
    );

  if(!container)
    return;


  const products =
    this.getProducts()
      .filter(
        p => p.active
      );


  container.innerHTML = "";


  products.forEach(
    product => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "card";


      card.innerHTML = `

        <h3>
          🎮 ${this.escape(
            product.name
          )}
        </h3>

        <div class="price">
          ${money(product.price)}
        </div>

        <label>
          ⏱️ Thời hạn key
        </label>

        <select
          id="duration-${product.id}">

          <option value="1">
            1 ngày
          </option>

          <option value="7">
            7 ngày
          </option>

          <option value="30">
            30 ngày
          </option>

        </select>

        <div
          id="stock-${product.id}"
          class="stock">

          Chọn thời hạn để xem kho

        </div>

        <button
          class="btn"
          onclick="
            GBAO.buySelected(
              '${product.id}'
            )
          ">

          🛒 Mua ngay

        </button>

      `;


      container.appendChild(card);


      const select =
        document.getElementById(
          "duration-" +
          product.id
        );


      const update =
        () => {

          const duration =
            Number(select.value);

          const stock =
            this.getStock(
              product.id,
              duration
            );


          document
          .getElementById(
            "stock-" +
            product.id
          )
          .textContent =
            "📦 Còn " +
            stock +
            " key";

        };


      select.addEventListener(
        "change",
        update
      );


      update();

    }
  );

},


buySelected(productId){

  const select =
    document.getElementById(
      "duration-" +
      productId
    );


  const duration =
    Number(select.value);


  this.buy(
    productId,
    duration
  );

},


/* =========================
   BALANCE
========================= */

addBalance(
  userId,
  amount
){

  const users =
    this.getUsers();


  const index =
    users.findIndex(
      u => u.id === userId
    );


  if(index === -1){

    throw new Error(
      "Không tìm thấy người dùng."
    );

  }


  users[index].balance +=
    Number(amount);


  write(
    KEYS.users,
    users
  );

},


/* =========================
   ADMIN
========================= */

requireAdmin(){

  const user =
    this.getUser();


  if(
    !user ||
    user.role !== "admin"
  ){

    document
      .getElementById(
        "adminPanel"
      )
      .style.display =
      "none";


    document
      .getElementById(
        "adminError"
      )
      .innerHTML = `

        <div class="panel error">

          ❌ Bạn không có quyền Admin.

          <br><br>

          <a href="login.html">
            Đăng nhập
          </a>

        </div>

      `;


    return false;

  }


  return true;

},


renderAdmin(){

  const users =
    this.getUsers();

  const products =
    this.getProducts();

  const inventory =
    this.getInventory();

  const orders =
    read(
      KEYS.orders,
      []
    );


  document
    .getElementById(
      "userCount"
    )
    .textContent =
    users.length;


  document
    .getElementById(
      "productCount"
    )
    .textContent =
    products.length;


  document
    .getElementById(
      "stockCount"
    )
    .textContent =
    inventory.filter(
      i => !i.sold
    ).length;


  document
    .getElementById(
      "orderCount"
    )
    .textContent =
    orders.length;


  const productSelect =
    document.getElementById(
      "inventoryProduct"
    );


  productSelect.innerHTML = "";


  products.forEach(
    p => {

      productSelect.innerHTML += `

        <option value="${p.id}">
          ${this.escape(p.name)}
        </option>

      `;

    }
  );


  const userSelect =
    document.getElementById(
      "balanceUser"
    );


  userSelect.innerHTML = "";


  users.forEach(
    u => {

      userSelect.innerHTML += `

        <option value="${u.id}">
          ${this.escape(
            u.username
          )}
          -
          ${money(u.balance)}
        </option>

      `;

    }
  );


  this.renderInventoryAdmin(
    inventory,
    products
  );


  this.renderUsersAdmin(
    users
  );

},


renderInventoryAdmin(
  inventory,
  products
){

  const box =
    document.getElementById(
      "inventoryTable"
    );


  if(!inventory.length){

    box.innerHTML =
      "Kho đang trống.";

    return;

  }


  box.innerHTML = "";


  inventory.forEach(
    item => {

      const product =
        products.find(
          p =>
            p.id ===
            item.productId
        );


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "key-info";


      div.innerHTML = `

        <b>
          ${
            product
            ?
            this.escape(
              product.name
            )
            :
            "Không rõ"
          }
        </b>

        <br>

        Thời hạn:
        ${item.duration} ngày

        <br>

        Key:
        ${this.escape(item.key)}

        <br>

        Trạng thái:
        ${
          item.sold
          ?
          "🔴 Đã bán"
          :
          "🟢 Còn hàng"
        }

      `;


      box.appendChild(div);

    }
  );

},


renderUsersAdmin(users){

  const box =
    document.getElementById(
      "usersTable"
    );


  box.innerHTML = "";


  users.forEach(
    user => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "key-info";


      div.innerHTML = `

        👤
        ${this.escape(
          user.username
        )}

        <br>

        Email:
        ${this.escape(
          user.email
        )}

        <br>

        Quyền:
        ${user.role}

        <br>

        Số dư:
        ${money(user.balance)}

      `;


      box.appendChild(div);

    }
  );

},


/* =========================
   ORDERS
========================= */

renderOrders(){

  const box =
    document.getElementById(
      "orders"
    );


  const user =
    this.getUser();


  if(!user){

    box.innerHTML = `

      <div class="panel">

        Bạn cần
        <a href="login.html">
          đăng nhập
        </a>
        để xem đơn hàng.

      </div>

    `;

    return;

  }


  const orders =
    read(
      KEYS.orders,
      []
    ).filter(
      o =>
        o.userId === user.id
    );


  if(!orders.length){

    box.innerHTML = `

      <div class="panel">

        Chưa có đơn hàng.

      </div>

    `;

    return;

  }


  box.innerHTML = "";


  orders
    .reverse()
    .forEach(
      order => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "panel";


        div.innerHTML = `

          <h3>
            ${this.escape(
              order.productName
            )}
          </h3>

          <p>
            Thời hạn:
            ${order.duration} ngày
          </p>

          <p>
            Giá:
            ${money(order.price)}
          </p>

          <p>
            Mã đơn:
            ${order.id}
          </p>

          <div class="key-info">

            🔑 KEY:

            <br>

            <b>
              ${this.escape(
                order.key
              )}
            </b>

          </div>

        `;


        box.appendChild(div);

      }
    );

},


/* =========================
   SECURITY DISPLAY
========================= */

escape(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}

};


window.GBAO = GBAO;

})();
