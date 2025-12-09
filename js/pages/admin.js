import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc, increment, setDoc, getDoc, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref as dbRef, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global Admin Settings
let adminSettings = {
    weeklyTarget: 20,
    rewardPoints: 10,
    telegramGroupPoints: 500
};

// قائمة الإيميلات المصرح لها بالوصول للوحة التحكم
const ADMIN_EMAILS = [
    'adatealm@gmail.com',
    'nourmt01@gmail.com',
    'yacinee474474@gmail.com',
    's22market@gmail.com',
    'adatshifa@gmail.com'
];

function isAdmin() {
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function renderAdmin() {
    // Check if user is admin
    if (!isAdmin()) {
        return renderAccessDenied();
    }

    return `
        <div class="animate-fade-in space-y-6">
            <!-- Header & Navigation -->
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-soft p-4 border border-gray-100 dark:border-gray-700 sticky top-0 z-20">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <i class="fas fa-shield-alt text-brand-600"></i>
                            لوحة التحكم
                        </h1>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <i class="fas fa-user-check ml-1"></i> ${auth.currentUser?.email}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <button id="refresh-data-btn" class="p-2 text-gray-500 hover:text-brand-600 transition-colors" title="تحديث البيانات">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <a href="#home" class="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors text-sm font-bold">
                            <i class="fas fa-arrow-right ml-1"></i> الرئيسية
                        </a>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar border-b border-gray-100 dark:border-gray-700">
                    <button class="tab-btn active" data-tab="dashboard">
                        <i class="fas fa-chart-pie"></i> نظرة عامة
                    </button>
                    <button class="tab-btn" data-tab="users">
                        <i class="fas fa-users"></i> المشرفين
                    </button>
                    <button class="tab-btn" data-tab="chat">
                        <i class="fas fa-comments"></i> المحادثة
                    </button>
                    <button class="tab-btn" data-tab="settings">
                        <i class="fas fa-cog"></i> الإعدادات
                    </button>
                </div>
            </div>

            <!-- Tab Contents -->
            <div id="tab-contents">
                <!-- 1. Dashboard Tab -->
                <div id="tab-dashboard" class="tab-content active space-y-6">
                    <!-- Quick Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-gray-500 text-sm">إثباتات معلقة</h3>
                                <div class="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                                    <i class="fas fa-clock text-orange-500"></i>
                                </div>
                            </div>
                            <p class="text-3xl font-bold text-orange-500" id="pending-count">...</p>
                        </div>
                        <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-gray-500 text-sm">تم قبولها (هذا الأسبوع)</h3>
                                <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                    <i class="fas fa-check-circle text-green-500"></i>
                                </div>
                            </div>
                            <p class="text-3xl font-bold text-green-500" id="approved-count">...</p>
                        </div>
                        <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-gray-500 text-sm">رسائل اليوم</h3>
                                <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                    <i class="fas fa-comment-alt text-blue-500"></i>
                                </div>
                            </div>
                            <p class="text-3xl font-bold text-blue-500" id="dashboard-msg-count">...</p>
                        </div>
                    </div>

                    <!-- Pending Review Section -->
                    <div>
                        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span class="w-1 h-6 bg-brand-500 rounded-full"></span>
                            طلبات الإثبات المعلقة
                        </h2>
                        <div id="submissions-list" class="space-y-4">
                            <div class="text-center text-gray-400 py-12">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>جاري تحميل البيانات...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. Users Tab -->
                <div id="tab-users" class="tab-content hidden space-y-6">
                    <div class="flex justify-between items-center bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft">
                        <div class="relative w-full md:w-64">
                            <input type="text" id="user-search" placeholder="بحث عن مشرف..." 
                                class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all">
                            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div class="text-sm text-gray-500">
                            إجمالي: <span id="total-users-count" class="font-bold text-brand-600">...</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-dark-card rounded-2xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div class="overflow-x-auto">
                            <table class="w-full text-right">
                                <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 text-sm">
                                    <tr>
                                        <th class="p-4 font-medium">المشرف</th>
                                        <th class="p-4 font-medium">النقاط</th>
                                        <th class="p-4 font-medium">الرتبة</th>
                                        <th class="p-4 font-medium">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="users-table-body" class="divide-y divide-gray-100 dark:divide-gray-700">
                                    <!-- Users will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Danger Zone -->
                    <div class="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl mt-8">
                        <h2 class="text-lg font-bold text-red-800 dark:text-red-400 mb-2">
                            <i class="fas fa-exclamation-triangle ml-2"></i> منطقة الخطر
                        </h2>
                        <div class="flex items-center justify-between flex-wrap gap-4">
                            <p class="text-sm text-red-700 dark:text-red-300">
                                تصفير نقاط وجداول جميع المشرفين لبدء أسبوع جديد. لا يمكن التراجع!
                            </p>
                            <button id="reset-all-points-btn" class="px-6 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-xl font-bold transition-all text-sm shadow-sm md:w-auto w-full">
                                تصفير الجميع
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Chat Tab -->
                <div id="tab-chat" class="tab-content hidden space-y-6">
                    <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft space-y-6">
                        <!-- Auto Delete -->
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div>
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <i class="fas fa-magic text-blue-500"></i>
                                    الحذف التلقائي
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">تفعيل مسح الرسائل تلقائياً كل فترة</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <select id="auto-delete-duration" class="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 focus:ring-brand-500">
                                    <option value="24">كل 24 ساعة</option>
                                    <option value="168">كل أسبوع</option>
                                    <option value="0">أبداً</option>
                                </select>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="auto-delete-enabled" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        <!-- Manual Delete -->
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                            <div>
                                <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <i class="fas fa-trash-alt text-red-500"></i>
                                    حذف المحادثة
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">
                                    عدد الرسائل الحالية: <span id="messages-count" class="font-bold">...</span>
                                </p>
                            </div>
                            <button id="delete-all-messages-btn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold shadow-sm">
                                حذف الكل فوراً
                            </button>
                        </div>
                        
                        <!-- Save Button -->
                        <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
                             <button id="save-chat-settings-btn" class="w-full px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md">
                                <i class="fas fa-save ml-1"></i> حفظ إعدادات المحادثة
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 4. Settings Tab -->
                <div id="tab-settings" class="tab-content hidden space-y-6">
                    <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft">
                        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-6">
                            <i class="fas fa-sliders-h ml-2 text-brand-600"></i> إعدادات النقاط
                        </h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    هدف التحدي الأسبوعي
                                </label>
                                <div class="relative">
                                    <input type="number" id="setting-target" class="block w-full pl-4 pr-10 py-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all" value="20" min="1">
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fas fa-bullseye"></i>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    نقاط المكافأة (قبول)
                                </label>
                                <div class="relative">
                                    <input type="number" id="setting-points" class="block w-full pl-4 pr-10 py-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all" value="10" min="1">
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fas fa-star"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    نقاط فتح مجموعة VIP
                                </label>
                                <div class="relative">
                                    <input type="number" id="setting-telegram-points" class="block w-full pl-4 pr-10 py-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all" value="500" min="0">
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fab fa-telegram"></i>
                                    </div>
                                </div>
                                <p class="mt-1 text-xs text-gray-500">يظهر زر الانضمام عند الوصول لهذا العدد من النقاط</p>
                            </div>
                        </div>

                        <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <button id="save-settings-btn" class="w-full md:w-auto px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md">
                                <i class="fas fa-save ml-1"></i> حفظ الكل
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Edit User Modal (Hidden) -->
            <div id="edit-user-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in">
                    <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">تعديل المشرف</h3>
                    <input type="hidden" id="edit-user-id">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm mb-1 text-gray-600 dark:text-gray-400">النقاط</label>
                            <input type="number" id="edit-user-points" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button id="save-edit-user" class="p-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">حفظ</button>
                            <button id="cancel-edit-user" class="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300">إلغاء</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;
}

function renderAccessDenied() {
    return `
        <div class="min-h-[70vh] flex items-center justify-center animate-fade-in">
            <div class="bg-white dark:bg-dark-card w-full max-w-md p-8 rounded-3xl shadow-card border border-red-100 dark:border-red-900/30 text-center">
                <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 text-3xl mb-4">
                    <i class="fas fa-ban"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">دخول مرفوض</h2>
                <p class="text-gray-500 mb-6">هذه المنطقة مخصصة للمشرفين فقط.</p>
                <a href="#home" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-md">
                    <i class="fas fa-home"></i> العودة للرئيسية
                </a>
            </div>
        </div>
    `;
}

export async function initAdmin() {
    if (!isAdmin()) return;

    // Tabs Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active', 'text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/20'));
            tab.classList.add('active', 'text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/20');

            const target = tab.dataset.tab;
            contents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${target}`).classList.remove('hidden');
        });
    });

    // Initialize Components
    await loadDashboardStats();
    await loadSettings();
    await loadChatSettings();

    // Lazy load users only when tab is clicked for the first time
    const usersTabBtn = document.querySelector('[data-tab="users"]');
    usersTabBtn.addEventListener('click', () => {
        if (!usersTabBtn.dataset.loaded) {
            loadAllUsers();
            usersTabBtn.dataset.loaded = "true";
        }
    });

    // Refresh Button
    document.getElementById('refresh-data-btn').addEventListener('click', () => {
        loadDashboardStats();
        if (usersTabBtn.dataset.loaded) loadAllUsers();
    });

    // Event Listeners for Actions
    setupSettingsActions();
    setupChatActions();
    setupUserActions();
}

async function loadDashboardStats() {
    const listContainer = document.getElementById('submissions-list');

    try {
        // Pending Submissions
        const q = query(collection(db, "proof_submissions"), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        document.getElementById('pending-count').innerText = snapshot.size;

        if (snapshot.empty) {
            listContainer.innerHTML = `
                <div class="text-center text-gray-400 py-12 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <i class="fas fa-check-circle text-5xl mb-3 text-green-100 dark:text-green-900"></i>
                    <p>لا توجد طلبات معلقة</p>
                </div>
            `;
        } else {
            listContainer.innerHTML = '';
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                renderSubmissionItem(listContainer, docSnap.id, data);
            });
        }

        // Approved Count (Simplified for now - can be real query)
        // For accurate weekly approved, we need a better query or counter. 
        // Using a placeholder or fetching basic status
        // document.getElementById('approved-count').innerText = "..."; 

        // Chat Count
        updateMessageCount();

    } catch (error) {
        console.error("Dashboard Load Error:", error);
    }
}

function renderSubmissionItem(container, id, data) {
    const el = document.createElement('div');
    el.className = "bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between";
    el.innerHTML = `
        <div class="flex items-center gap-4 w-full md:w-auto">
            <a href="${data.imageUrl}" target="_blank" class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img src="${data.imageUrl}" class="w-full h-full object-cover">
            </a>
            <div>
                <h4 class="font-bold dark:text-white capitalize">${data.username || "مشرف"}</h4>
                <a href="${data.postLink}" target="_blank" class="text-xs text-brand-500 hover:underline">عرض المنشور <i class="fas fa-external-link-alt"></i></a>
            </div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
            <button class="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition-colors action-btn" data-action="approve" data-id="${id}" data-uid="${data.userId}">
                <i class="fas fa-check"></i> قبول
            </button>
            <button class="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-colors action-btn" data-action="reject" data-id="${id}">
                <i class="fas fa-times"></i> رفض
            </button>
        </div>
    `;
    container.appendChild(el);

    // Bind events immediately
    const btns = el.querySelectorAll('.action-btn');
    btns.forEach(btn => btn.addEventListener('click', handleSubmissionAction));
}

async function handleSubmissionAction(e) {
    const btn = e.target.closest('button');
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const uid = btn.dataset.uid;
    const parent = btn.closest('.bg-white');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const submissionRef = doc(db, "proof_submissions", id);
        await updateDoc(submissionRef, {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewedAt: new Date(),
            reviewedBy: auth.currentUser.email
        });

        if (action === 'approve') {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                points: increment(adminSettings.rewardPoints),
                "weeklyProgress.count": increment(1),
                "stats.approvedSubmissions": increment(1)
            });
        } else {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                "stats.rejectedSubmissions": increment(1)
            });
        }

        parent.remove();
        // Update pending count
        const countBox = document.getElementById('pending-count');
        countBox.innerText = Math.max(0, parseInt(countBox.innerText) - 1);

    } catch (error) {
        alert("Error: " + error.message);
        btn.disabled = false;
        btn.innerHTML = action === 'approve' ? 'قبول' : 'رفض';
    }
}

// ==========================================
// USER MANAGEMENT
// ==========================================
async function loadAllUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</td></tr>';

    try {
        const q = query(collection(db, "users"), orderBy("points", "desc"), limit(50));
        const snapshot = await getDocs(q);

        document.getElementById('total-users-count').innerText = snapshot.size; // Just loaded count
        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors";
            row.innerHTML = `
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.name}" class="w-8 h-8 rounded-full">
                        <div>
                            <div class="font-bold dark:text-white text-sm">${user.name || 'بدون اسم'}</div>
                            <div class="text-xs text-gray-400">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4 font-mono font-bold text-brand-600">${user.points || 0}</td>
                <td class="p-4"><span class="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded">${user.rank || 'متدرب'}</span></td>
                <td class="p-4">
                    <button class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg edit-user-btn" data-id="${doc.id}" data-points="${user.points || 0}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.isAdmin ? '<i class="fas fa-shield-alt text-brand-500 ml-2" title="أدمن"></i>' : ''}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Search Filter
        document.getElementById('user-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });

        // Edit User Logic
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditUser(btn.dataset.id, btn.dataset.points));
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 p-4">فشل تحميل المستخدمين: ${error.message}</td></tr>`;
    }
}

function openEditUser(uid, currentPoints) {
    const modal = document.getElementById('edit-user-modal');
    document.getElementById('edit-user-id').value = uid;
    document.getElementById('edit-user-points').value = currentPoints;
    modal.classList.remove('hidden');
}

function setupUserActions() {
    // Save Edit
    document.getElementById('save-edit-user').addEventListener('click', async () => {
        const uid = document.getElementById('edit-user-id').value;
        const newPoints = parseInt(document.getElementById('edit-user-points').value);
        const modal = document.getElementById('edit-user-modal');

        try {
            await updateDoc(doc(db, "users", uid), { points: newPoints });
            alert("تم تحديث النقاط بنجاح");
            modal.classList.add('hidden');
            loadAllUsers(); // Reload table
        } catch (error) {
            alert("فشل التحديث: " + error.message);
        }
    });

    // Cancel Edit
    document.getElementById('cancel-edit-user').addEventListener('click', () => {
        document.getElementById('edit-user-modal').classList.add('hidden');
    });

    // Reset All Points
    document.getElementById('reset-all-points-btn').addEventListener('click', async () => {
        if (!confirm('⚠️ تحذير خطير!\n\nهل أنت متأكد تماماً من تصفير نقاط جميع المشرفين؟')) return;

        try {
            const q = query(collection(db, "users"));
            const snapshot = await getDocs(q);
            const batchPromises = snapshot.docs.map(d => updateDoc(doc(db, "users", d.id), {
                points: 0,
                'weeklyProgress.count': 0
            }));
            await Promise.all(batchPromises);
            alert("تم تصفير جميع النقاط بنجاح!");
            loadAllUsers();
        } catch (error) {
            alert("حدث خطأ: " + error.message);
        }
    });
}

// ==========================================
// CHAT & SETTINGS MANAGEMENT
// ==========================================
async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) {
            adminSettings = docSnap.data();
            document.getElementById('setting-target').value = adminSettings.weeklyTarget || 20;
            document.getElementById('setting-points').value = adminSettings.rewardPoints || 10;
            document.getElementById('setting-telegram-points').value = adminSettings.telegramGroupPoints || 500;
        }
    } catch (e) { console.log("Using default settings"); }
}

function setupSettingsActions() {
    document.getElementById('save-settings-btn').addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        btn.disabled = true;

        try {
            const newSettings = {
                weeklyTarget: parseInt(document.getElementById('setting-target').value),
                rewardPoints: parseInt(document.getElementById('setting-points').value),
                telegramGroupPoints: parseInt(document.getElementById('setting-telegram-points').value),
            };

            await setDoc(doc(db, "settings", "global"), newSettings, { merge: true });
            adminSettings = { ...adminSettings, ...newSettings };

            btn.innerHTML = '<i class="fas fa-check"></i> تم الحفظ';
            setTimeout(() => btn.innerHTML = '<i class="fas fa-save ml-1"></i> حفظ الكل', 2000);
        } catch (error) {
            alert("Error: " + error.message);
            btn.innerHTML = '<i class="fas fa-save ml-1"></i> حفظ الكل';
        }
        btn.disabled = false;
    });
}

// Chat Management (Realtime Database)
async function loadChatSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists() && docSnap.data().chatAutoDelete) {
            const s = docSnap.data().chatAutoDelete;
            document.getElementById('auto-delete-enabled').checked = s.enabled;
            document.getElementById('auto-delete-duration').value = s.duration;
        }
    } catch (e) { }
}

function updateMessageCount() {
    try {
        const app_ = auth.app; // access initialized app instance
        const rtdb = getDatabase(app_);
        const messagesRef = dbRef(rtdb, 'daily_chat');
        onValue(messagesRef, (snapshot) => {
            const count = snapshot.exists() ? snapshot.size : 0;
            const els = ['messages-count', 'dashboard-msg-count'];
            els.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = count;
            });
        }, { onlyOnce: true });
    } catch (e) { console.error(e); }
}

function setupChatActions() {
    // Save Chat Settings
    document.getElementById('save-chat-settings-btn').addEventListener('click', async () => {
        try {
            await setDoc(doc(db, "settings", "global"), {
                chatAutoDelete: {
                    enabled: document.getElementById('auto-delete-enabled').checked,
                    duration: parseInt(document.getElementById('auto-delete-duration').value),
                    lastUpdated: new Date()
                }
            }, { merge: true });
            alert("تم حفظ إعدادات المحادثة");
        } catch (e) { alert(e.message); }
    });

    // Delete All Messages
    document.getElementById('delete-all-messages-btn').addEventListener('click', async () => {
        if (!confirm("هل أنت متأكد من حذف جميع رسائل المحادثة؟")) return;

        try {
            const app_ = auth.app;
            const rtdb = getDatabase(app_);
            await remove(dbRef(rtdb, 'daily_chat'));
            alert("تم حذف جميع الرسائل بنجاح");
            updateMessageCount();
        } catch (e) { alert(e.message); }
    });
}

