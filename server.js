const express = require("express");
const app = express();
const fs = require("fs");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.json());

// 📧 EMAIL SETUP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 💳 CREATE STRIPE CHECKOUT
app.post("/create-checkout-session", async (req, res) => {
  try {
    const items = req.body.items;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: items.map(item => ({
        price_data: {
          currency: "aud",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity
      })),

      success_url: "http://localhost:5500/success.html",
      cancel_url: "http://localhost:5500/cancel.html",
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send("Error creating checkout session");
  }
});

// 🪝 STRIPE WEBHOOK (FIXED)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const event = req.body;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // 📧 EMAIL
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Order 🎉",
      text: `New order! Amount: $${session.amount_total / 100}`
    });

    // 📦 SAVE ORDER
    const orders = JSON.parse(fs.readFileSync("orders.json", "utf8") || "[]");

    orders.push({
      id: session.id,
      amount: session.amount_total,
      date: new Date()
    });

    fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));

    console.log("📦 Order saved + email sent!");
  }

  res.sendStatus(200);
});