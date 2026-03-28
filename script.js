let cart = JSON.parse(localStorage.getItem("cart")) || {};

const products = {
  vanilla: { name: "Vanilla Swirl", price: 7.49 },
  strawberry: { name: "Strawberry Kingdom", price: 7.49 },
  lavender: { name: "Lavender Paradise", price: 7.49 }
};

// 💾 Save cart
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ➕ Add item
function addToCart(key) {
  cart[key] = (cart[key] || 0) + 1;
  saveCart();
  displayCart();
  openCart();
}
// 🔄 Change quantity
function changeQuantity(key, amount) {
  if (!cart[key]) return;

  cart[key] += amount;

  if (cart[key] <= 0) {
    delete cart[key];
  }

  saveCart();
  displayCart();
}

// 🗑️ Remove item completely
function removeItem(key) {
  delete cart[key];
  saveCart();
  displayCart();
}

// 🛒 Display cart
function displayCart() {
  const cartDiv = document.getElementById("cart-items");
  const totalDiv = document.getElementById("total");

  cartDiv.innerHTML = "";
  let total = 0;

  for (let key in cart) {
    const item = products[key];
    const qty = cart[key];

    total += item.price * qty;

    const div = document.createElement("div");

    div.innerHTML = `
      <strong>${item.name}</strong><br>
      $${item.price.toFixed(2)} x ${qty}
      <div style="margin-top:5px;">
        <button onclick="changeQuantity('${key}', -1)">-</button>
        <button onclick="changeQuantity('${key}', 1)">+</button>
        <button onclick="removeItem('${key}')">🗑️</button>
      </div>
    `;

    cartDiv.appendChild(div);
  }

  totalDiv.innerText = "Total: $" + total.toFixed(2);
}

// 🛒 Toggle cart
function toggleCart() {
  document.getElementById("cart-drawer").classList.toggle("open");
}

function openCart() {
  document.getElementById("cart-drawer").classList.add("open");
}

// 💳 Checkout popup
function checkout() {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty!");
    return;
  }

  document.getElementById("checkout-popup").classList.add("show");
}

function closePopup() {
  document.getElementById("checkout-popup").classList.remove("show");
}

// 📦 Submit order
async function submitCheckout() {
  const email = document.getElementById("email").value;
  const address = document.getElementById("address").value;

  if (!email || !address) {
    alert("Please fill required fields");
    return;
  }

  // convert cart into array for Stripe
  const items = Object.keys(cart).map(key => ({
    name: products[key].name,
    price: products[key].price,
    quantity: cart[key]
  }));

  try {
    const res = await fetch("http://localhost:3000/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items })
    });

    const data = await res.json();

    // 🚀 REDIRECT TO STRIPE
    window.location.href = data.url;

  } catch (err) {
    console.error("Checkout error:", err);
    alert("Checkout failed. Check console.");
  }
}