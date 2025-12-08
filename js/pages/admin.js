import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function renderAdmin() {
    return `
        <div class="animate-fade-in">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">لوحة الإدارة</h1>
            
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft">
                    <h3 class="text-gray-500 text-sm">إثباتات معلقة</h3>
                    <p class="text-2xl font-bold text-orange-500 mt-2" id="pending-count">...</p>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft">
                     <h3 class="text-gray-500 text-sm">تم قبولها (هذا الأسبوع)</h3>
                    <p class="text-2xl font-bold text-green-500 mt-2" id="approved-count">...</p>
                </div>
                 <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft">
                     <h3 class="text-gray-500 text-sm">أعضاء نشطين</h3>
                    <p class="text-2xl font-bold text-blue-500 mt-2">5</p>
                </div>
            </div>

            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">طلبات الإثبات المعلقة</h2>
            <div id="submissions-list" class="space-y-4">
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>جاري تحميل البيانات...</p>
                </div>
            </div>
        </div>
    `;
}

export async function initAdmin() {
    const listContainer = document.getElementById('submissions-list');

    try {
        const q = query(collection(db, "proof_submissions"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        document.getElementById('pending-count').innerText = querySnapshot.size;

        if (querySnapshot.empty) {
            listContainer.innerHTML = `
                <div class="text-center text-gray-400 py-8 bg-white dark:bg-dark-card rounded-2xl">
                    <i class="fas fa-check-circle text-4xl mb-3 text-green-100 dark:text-green-900"></i>
                    <p>لا توجد طلبات معلقة حالياً</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const el = document.createElement('div');
            el.className = "bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between";
            el.innerHTML = `
                <div class="flex items-start gap-4 flex-1">
                    <a href="${data.imageUrl}" target="_blank" class="block w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative group">
                        <img src="${data.imageUrl}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Proof">
                        <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i class="fas fa-search-plus text-white"></i>
                        </div>
                    </a>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-bold text-gray-900 dark:text-white">${data.username || "User"}</h3>
                            <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-500">${new Date(data.submittedAt?.toDate()).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <a href="${data.postLink}" target="_blank" class="text-brand-600 hover:underline text-sm flex items-center gap-1 mb-2">
                            <i class="fas fa-external-link-alt text-xs"></i> رابط المنشور
                        </a>
                        <p class="text-xs text-gray-400">ID: ${docSnap.id}</p>
                    </div>
                </div>
                
                <div class="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button class="action-btn flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-colors font-bold text-sm" data-action="approve" data-id="${docSnap.id}" data-uid="${data.userId}">
                        <i class="fas fa-check ml-1"></i> قبول
                    </button>
                    <button class="action-btn flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors font-bold text-sm" data-action="reject" data-id="${docSnap.id}">
                        <i class="fas fa-times ml-1"></i> رفض
                    </button>
                </div>
            `;
            listContainer.appendChild(el);
        });

        // Add Event Listeners
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const uid = btn.dataset.uid;
                const parent = btn.closest('.bg-white'); // the card

                // UI Feedback
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;

                try {
                    const submissionRef = doc(db, "proof_submissions", id);
                    await updateDoc(submissionRef, {
                        status: action === 'approve' ? 'approved' : 'rejected',
                        reviewedAt: new Date() // Client timestamp for simplicity
                    });

                    if (action === 'approve') {
                        // Increment User Points & Weekly Progress
                        const userRef = doc(db, "users", uid);
                        // Note: Using dot notation for nested field update
                        await updateDoc(userRef, {
                            points: increment(10), // Configurable points
                            "weeklyProgress.count": increment(1)
                        });
                    }

                    // Remove from list or show success
                    parent.style.opacity = '0.5';
                    parent.innerHTML = `<div class="p-4 text-center w-full text-gray-500">تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب</div>`;

                } catch (error) {
                    console.error("Action error:", error);
                    alert("حدث خطأ: " + error.message);
                    btn.innerHTML = action === 'approve' ? 'قبول' : 'رفض';
                    btn.disabled = false;
                }
            });
        });

    } catch (error) {
        console.error("Admin Load Error:", error);
        listContainer.innerHTML = `<div class="text-red-500 text-center">فشل تحميل البيانات: ${error.message}</div>`;
    }
}
