
import { rtdb, auth } from '../firebase-config.js';
// rtdb is initialized instance. We need functions from SDK.
import { ref, push, onChildAdded, onChildRemoved, query, limitToLast, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Keep track of listener to avoid duplicates if returning to page
let chatRef = null;

export function renderChat() {
    return `
        <div class="flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-140px)] animate-fade-in">
            <!-- Chat Header -->
            <div class="bg-white dark:bg-dark-card p-4 rounded-t-2xl shadow-sm border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                        <i class="fas fa-hashtag text-xl"></i>
                    </div>
                    <div>
                        <h2 class="font-bold text-gray-900 dark:text-white">المحادثة اليومية</h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400">تحذف الرسائل تلقائياً كل 24 ساعة</p>
                    </div>
                </div>
                <div class="flex -space-x-2 space-x-reverse overflow-hidden">
                    <!-- Online users placeholder -->
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://ui-avatars.com/api/?name=User&background=random" alt=""/>
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://ui-avatars.com/api/?name=Admin&background=random" alt=""/>
                    <span class="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300">+5</span>
                </div>
            </div>

            <!-- Privacy Warning Banner -->
            <div class="bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-lg border-b-2 border-red-600">
                <div class="flex items-start gap-3 text-white">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-sm mb-1">⚠️ تحذير خصوصية الصور</h4>
                        <p class="text-xs leading-relaxed opacity-95">
                            <strong>تنبيه مهم:</strong> الصور التي تُرسل في المحادثة يتم رفعها عبر سيرفرات خارجية (مثل Imgur).
                            <br/>
                            <strong>احذر من إرسال صور شخصية أو خاصة!</strong> النصوص آمنة ومحمية.
                        </p>
                    </div>
                    <div class="flex-shrink-0">
                        <i class="fas fa-shield-alt text-xl opacity-75"></i>
                    </div>
                </div>
            </div>

            <!-- Messages Area -->
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-bg scroll-smooth">
                <!-- Messages will be injected here -->
                <div class="text-center text-gray-400 text-sm py-4">
                    بداية المحادثة لهذا اليوم...
                </div>
            </div>

            <!-- Input Area -->
            <form id="chat-form" class="bg-white dark:bg-dark-card p-4 rounded-b-2xl shadow-soft border-t border-gray-100 dark:border-gray-700">
                <div class="relative flex items-center gap-2">
                    <input type="text" id="message-input" autocomplete="off" class="block w-full pl-3 pr-24 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-sm" placeholder="اكتب رسالتك هنا...">
                    
                    <input type="file" id="image-input" accept="image/*" class="hidden">
                    
                    <button type="button" id="attach-btn" class="absolute left-4 p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" title="إرفاق صورة">
                        <i class="fas fa-paperclip text-lg"></i>
                    </button>

                    <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl shadow-md transition-colors flex items-center justify-center">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </form>

            <!-- Image Warning Modal -->
            <div id="image-warning-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-exclamation-triangle text-3xl text-orange-600 dark:text-orange-400"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تحذير الخصوصية</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            الصور تُرفع عبر سيرفرات خارجية (Imgur). 
                            <strong class="text-red-600 dark:text-red-400">لا ترسل صور شخصية أو حساسة!</strong>
                        </p>
                    </div>

                    <div class="flex items-center gap-3 mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <input type="checkbox" id="dont-show-again" class="w-4 h-4 text-brand-600 rounded">
                        <label for="dont-show-again" class="text-sm text-gray-700 dark:text-gray-300">لا تُظهر هذا مرة أخرى</label>
                    </div>

                    <div class="flex gap-3">
                        <button id="proceed-upload-btn" class="flex-1 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors">
                            <i class="fas fa-check ml-1"></i> فهمت، استمر
                        </button>
                        <button id="cancel-upload-btn" class="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors">
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

let pendingImageFile = null;

export function initChat() {
    const messagesContainer = document.getElementById('messages-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const attachBtn = document.getElementById('attach-btn');
    const imageInput = document.getElementById('image-input');
    const imageWarningModal = document.getElementById('image-warning-modal');
    const proceedBtn = document.getElementById('proceed-upload-btn');
    const cancelBtn = document.getElementById('cancel-upload-btn');
    const dontShowCheckbox = document.getElementById('dont-show-again');

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Handle attach button click
    attachBtn?.addEventListener('click', () => {
        imageInput.click();
    });

    // Handle image selection
    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if user disabled warning
            const hideWarning = localStorage.getItem('hideImageWarning') === 'true';

            if (hideWarning) {
                uploadImage(file);
            } else {
                pendingImageFile = file;
                imageWarningModal?.classList.remove('hidden');
            }
        }
    });

    // Proceed with upload
    proceedBtn?.addEventListener('click', () => {
        if (dontShowCheckbox.checked) {
            localStorage.setItem('hideImageWarning', 'true');
        }

        if (pendingImageFile) {
            uploadImage(pendingImageFile);
            pendingImageFile = null;
        }

        imageWarningModal?.classList.add('hidden');
        imageInput.value = '';
    });

    // Cancel upload
    cancelBtn?.addEventListener('click', () => {
        pendingImageFile = null;
        imageWarningModal?.classList.add('hidden');
        imageInput.value = '';
    });

    // Upload image function (placeholder - needs Imgur API)
    function uploadImage(file) {
        // TODO: Implement Imgur upload
        alert('ميزة رفع الصور قيد التطوير');
        console.log('Image to upload:', file.name);
    }

    // Send Message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();

        if (text && auth.currentUser) {
            const messagesRef = ref(rtdb, 'daily_chat');
            push(messagesRef, {
                userId: auth.currentUser.uid,
                username: auth.currentUser.displayName || 'User',
                text: text,
                timestamp: serverTimestamp(),
                photoURL: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName || 'User'}`
            });

            messageInput.value = '';
        } else if (!auth.currentUser) {
            alert("يرجى تسجيل الدخول للمشاركة في المحادثة");
        }
    });

    // Listen for Messages
    const messagesRef = query(ref(rtdb, 'daily_chat'), limitToLast(50));

    // Clear previous listener if any (simplistic approach, ideally we unsubscribe)
    // For this simple app, we just start listening. Duplicates might occur if we don't handle cleanup,
    // but app.js reloads module on nav, so we depend on DOM being fresh.

    // We need to check if we already have listeners to avoid double messages if we revisit the page in SPA
    // But since container is cleared on render, we just need to re-attach.
    // However, onChildAdded will fire for all existing messages.

    // Clear initial "Start of chat" text if messages exist
    let isFirstMessage = true;

    onChildAdded(messagesRef, (snapshot) => {
        if (isFirstMessage) {
            messagesContainer.innerHTML = ''; // Clear placeholder
            isFirstMessage = false;
        }

        const msg = snapshot.val();
        const isMe = auth.currentUser && msg.userId === auth.currentUser.uid;
        const div = document.createElement('div');

        if (isMe) {
            div.className = "flex justify-end items-end gap-2 animate-fade-in";
            div.innerHTML = `
                <div class="flex flex-col items-end max-w-[80%]">
                    <div class="bg-brand-600 text-white px-4 py-2 rounded-2xl rounded-tl-sm shadow-md text-sm">
                        ${escapeHtml(msg.text)}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 mr-1">${formatTime(msg.timestamp)}</span>
                </div>
                <img src="${msg.photoURL}" class="w-8 h-8 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-700">
            `;
        } else {
            div.className = "flex justify-start items-end gap-2 animate-fade-in";
            div.innerHTML = `
                <img src="${msg.photoURL}" class="w-8 h-8 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-700">
                <div class="flex flex-col items-start max-w-[80%]">
                    <span class="text-[10px] text-gray-500 mb-1 ml-1">${escapeHtml(msg.username)}</span>
                    <div class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-2xl rounded-tr-sm shadow-sm border border-gray-100 dark:border-gray-600 text-sm">
                        ${escapeHtml(msg.text)}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 ml-1">${formatTime(msg.timestamp)}</span>
                </div>
            `;
        }

        messagesContainer.appendChild(div);
        scrollToBottom();
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTime(timestamp) {
    if (!timestamp) return 'Now';
    return new Date(timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}
