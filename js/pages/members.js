import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function renderMembers() {
    return `
        <div class="animate-fade-in space-y-8 pb-10">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <i class="fas fa-users text-brand-600"></i>
                        مشرفي الفريق
                    </h1>
                    <p class="text-gray-500 dark:text-gray-400 mt-2 text-lg">لوحة متابعة الأداء والإحصائيات دقيقة للمشرفين</p>
                </div>
                
                <div class="flex items-center gap-3 bg-white dark:bg-dark-card p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span class="text-sm font-medium text-gray-500 px-3">عرض:</span>
                    <button id="view-grid" class="p-2 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 transition-colors">
                        <i class="fas fa-grid-2"></i>
                    </button>
                    <button id="view-list" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <i class="fas fa-list"></i>
                    </button>
                </div>
            </div>

            <!-- Advanced Statistics Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <!-- Total Members -->
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl">
                                <i class="fas fa-users"></i>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                                <i class="fas fa-arrow-up"></i> نشط
                            </span>
                        </div>
                        <h3 class="text-gray-500 dark:text-gray-400 font-medium text-sm">إجمالي المشرفين</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1" id="stat-total">...</p>
                        <div class="mt-3 text-xs text-gray-400 flex items-center justify-between">
                            <span id="stat-new-count">... جدد هذا الأسبوع</span>
                            <div class="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Weekly Completion Rate -->
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 text-xl">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg" id="stat-rate-badge">0%</span>
                        </div>
                        <h3 class="text-gray-500 dark:text-gray-400 font-medium text-sm">نسبة إنجاز الهدف</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1" id="stat-completion-rate">0%</p>
                        <p class="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <i class="fas fa-check-circle"></i>
                            <span id="stat-completed-count">0</span> مشرف حققوا الهدف
                        </p>
                    </div>
                </div>

                <!-- Top Performer -->
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-32 h-32 bg-yellow-50 dark:bg-yellow-900/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-xl">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <i class="fas fa-star text-yellow-400 text-lg animate-pulse"></i>
                        </div>
                        <h3 class="text-gray-500 dark:text-gray-400 font-medium text-sm">الأعلى أداءً</h3>
                        <div class="flex items-center gap-3 mt-2">
                            <img id="stat-top-img" src="" class="w-10 h-10 rounded-full bg-gray-200 object-cover hidden">
                            <div class="hidden" id="stat-top-info">
                                <p class="text-lg font-bold text-gray-900 dark:text-white leading-tight" id="stat-top-name">...</p>
                                <p class="text-xs text-gray-500" id="stat-top-score">... نقطة</p>
                            </div>
                            <p id="stat-top-empty" class="text-sm text-gray-400 italic">لا يوجد بيانات</p>
                        </div>
                    </div>
                </div>

                <!-- Active Members Ratio -->
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 text-xl">
                                <i class="fas fa-chart-pie"></i>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">إجمالي</span>
                        </div>
                        <h3 class="text-gray-500 dark:text-gray-400 font-medium text-sm">نشاط الفريق</h3>
                        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1" id="stat-total-points">0</p>
                        <div class="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-purple-500 h-1.5 rounded-full" style="width: 0%" id="stat-activity-bar"></div>
                        </div>
                        <p class="mt-2 text-xs text-gray-400 text-left">مجموع النقاط</p>
                    </div>
                </div>
            </div>

            <!-- Filters & Search Bar -->
            <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row gap-4">
                <div class="flex-1 relative">
                    <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" id="search-members" 
                        class="w-full pl-4 pr-11 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                        placeholder="ابحث عن عضو بالاسم...">
                </div>
                
                <div class="flex gap-3 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
                    <select id="filter-role" class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-[140px]">
                        <option value="all">كل الرتب</option>
                        <option value="leader">القيادة</option>
                        <option value="senior">مشرفين أوائل</option>
                        <option value="moderator">مشرفين</option>
                        <option value="trainee">متدربين</option>
                    </select>

                    <select id="sort-by" class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-[160px]">
                        <option value="points-desc">الأعلى نقاط</option>
                        <option value="points-asc">الأقل نقاط</option>
                        <option value="progress-desc">الأكثر إنجازاً</option>
                        <option value="newest">المنضمين حديثاً</option>
                    </select>
                </div>
            </div>

            <!-- Members List -->
            <div id="members-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <div class="col-span-full h-64 flex flex-col items-center justify-center text-gray-400">
                    <i class="fas fa-circle-notch fa-spin text-3xl mb-4 text-brand-500"></i>
                    <p class="animate-pulse">جاري تحميل بيانات الفريق...</p>
                </div>
            </div>

            <!-- Empty State (Hidden) -->
            <div id="empty-state" class="hidden text-center py-20">
                <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-search text-4xl text-gray-300 dark:text-gray-600"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد نتائج</h3>
                <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">لم يتم العثور على أي أعضاء يطابقون معايير البحث الحالية.</p>
                <button id="reset-filters" class="mt-6 px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                    إنهاء البحث
                </button>
            </div>

            <!-- Member Details Modal -->
            <div id="member-details-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" id="close-details-overlay"></div>
                <div class="relative w-full max-w-md bg-white dark:bg-dark-card rounded-3xl shadow-2xl transform transition-all animate-scale-up overflow-hidden">
                    
                     <div class="h-32 bg-gradient-to-r from-brand-600 to-blue-500 relative">
                        <button id="close-details-btn" class="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm z-10 w-8 h-8 flex items-center justify-center">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="absolute inset-0 bg-pattern opacity-10"></div>
                    </div>

                    <div class="px-8 pb-8 -mt-16 text-center relative z-10">
                        <div class="relative inline-block mb-4">
                            <img id="modal-avatar" src="" class="w-32 h-32 rounded-full border-[6px] border-white dark:border-dark-card shadow-xl bg-white object-cover">
                            <div id="modal-badge-container" class="absolute bottom-2 right-2"></div>
                        </div>

                        <h3 id="modal-name" class="text-2xl font-bold text-gray-900 dark:text-white mb-1">...</h3>
                        <p id="modal-rank" class="text-sm font-medium text-brand-600 mb-6 bg-brand-50 dark:bg-brand-900/20 py-1 px-4 rounded-full inline-block">...</p>
                        
                        <div class="grid grid-cols-2 gap-4 mb-8">
                             <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                                <p class="text-xs text-gray-500 mb-1">النقاط الكلية</p>
                                <p id="modal-points" class="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                             </div>
                             <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                                <p class="text-xs text-gray-500 mb-1">المستوى</p>
                                <p id="modal-level" class="text-2xl font-bold text-gray-900 dark:text-white">1</p>
                             </div>
                        </div>

                            <div class="space-y-4 text-right">
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">المعلومات الشخصية</h4>

                            <!-- Academic Info -->
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <p class="text-[10px] text-indigo-400 mb-1">السنة الدراسية</p>
                                    <p id="modal-academic" class="font-bold text-indigo-700 dark:text-indigo-300 text-sm truncate">...</p>
                                </div>
                                <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/30">
                                    <p class="text-[10px] text-purple-400 mb-1">التخصص</p>
                                    <p id="modal-specialty" class="font-bold text-purple-700 dark:text-purple-300 text-sm truncate">...</p>
                                </div>
                            </div>
                            
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">معلومات الاتصال</h4>
                            
                            <div class="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500">البريد الإلكتروني</p>
                                    <p id="modal-email" class="text-sm font-medium text-gray-900 dark:text-white truncate">...</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                    <i class="fas fa-phone"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500">رقم الهاتف</p>
                                    <p id="modal-phone" class="text-sm font-medium text-gray-900 dark:text-white truncate">...</p>
                                </div>
                            </div>
                        </div>

                        <div id="modal-social" class="flex justify-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <!-- Social Links Injected Here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initMembers() {
    const membersList = document.getElementById('members-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-members');
    const roleFilter = document.getElementById('filter-role');
    const sortSelect = document.getElementById('sort-by');

    let allMembers = [];
    let settings = { weeklyTarget: 20, colleagueViewPoints: 100 };

    try {
        // Fetch settings first
        const settingsDoc = await getDoc(doc(db, "settings", "global"));
        if (settingsDoc.exists()) {
            settings = { ...settings, ...settingsDoc.data() };
        }

        // Fetch users
        const usersQuery = query(collection(db, "users"), orderBy("points", "desc"));
        const querySnapshot = await getDocs(usersQuery);

        allMembers = [];
        querySnapshot.forEach((doc) => {
            allMembers.push({ id: doc.id, ...doc.data() });
        });

        // Calculate and Render
        updateStats(allMembers);
        filterAndRender();

        // Event Listeners
        searchInput.addEventListener('input', filterAndRender);
        roleFilter.addEventListener('change', filterAndRender);
        sortSelect.addEventListener('change', filterAndRender);
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            searchInput.value = '';
            roleFilter.value = 'all';
            sortSelect.value = 'points-desc';
            filterAndRender();
        });

    } catch (error) {
        console.error("Error loading members:", error);
        membersList.innerHTML = `
            <div class="col-span-full bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl text-center border border-red-200 dark:border-red-800">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>
                <p class="text-red-800 dark:text-red-200">حدث خطأ أثناء تحميل البيانات</p>
                <p class="text-sm text-red-600 dark:text-red-300 mt-1">${error.message}</p>
            </div>
        `;
    }

    // Modal Closing Logic
    const detailsModal = document.getElementById('member-details-modal');
    const closeOverlay = document.getElementById('close-details-overlay');
    const closeBtn = document.getElementById('close-details-btn');
    const closeDetails = () => {
        detailsModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (closeOverlay) closeOverlay.addEventListener('click', closeDetails);
    if (closeBtn) closeBtn.addEventListener('click', closeDetails);


    function updateStats(members) {
        // Total Stats
        animateValue(document.getElementById('stat-total'), 0, members.length, 1000);

        // New Members (This week - mockup assumption or based on date if available)
        // Since we don't have joinedAt date for all, we assume points = 0 is new
        const newMembers = members.filter(m => m.points === 0).length;
        document.getElementById('stat-new-count').innerText = `${newMembers} جدد هذا الأسبوع`;

        // Completion Rate
        const target = settings.weeklyTarget;
        const completed = members.filter(m => (m.weeklyProgress?.count || 0) >= target);
        const rate = Math.round((completed.length / members.length) * 100) || 0;

        document.getElementById('stat-completion-rate').innerText = `${rate}%`;
        document.getElementById('stat-completed-count').innerText = completed.length;
        document.getElementById('stat-rate-badge').innerHTML = rate >= 50 ? '<i class="fas fa-arrow-up"></i> ممتاز' : '<i class="fas fa-arrow-down"></i> يحتاج تحسين';
        document.getElementById('stat-rate-badge').className = `text-xs font-bold px-2 py-1 rounded-lg ${rate >= 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`;

        // Top Performer (Max Weekly Count)
        const topPerformer = [...members].sort((a, b) => (b.weeklyProgress?.count || 0) - (a.weeklyProgress?.count || 0))[0];

        if (topPerformer && (topPerformer.weeklyProgress?.count || 0) > 0) {
            document.getElementById('stat-top-empty').classList.add('hidden');
            const info = document.getElementById('stat-top-info');
            const img = document.getElementById('stat-top-img');

            info.classList.remove('hidden');
            img.classList.remove('hidden');

            document.getElementById('stat-top-name').innerText = topPerformer.username;
            document.getElementById('stat-top-score').innerText = `${topPerformer.weeklyProgress?.count} من ${target} مهمة`;
            img.src = topPerformer.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(topPerformer.username)}&background=random`;
        }

        // Activity Stats
        const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
        animateValue(document.getElementById('stat-total-points'), 0, totalPoints, 1500);

        const activeUsersCount = members.filter(m => m.points > 0).length;
        const activityRate = (activeUsersCount / members.length) * 100;
        document.getElementById('stat-activity-bar').style.width = `${activityRate}%`;
    }

    function filterAndRender() {
        const queryText = searchInput.value.toLowerCase();
        const roleValue = roleFilter.value;
        const sortValue = sortSelect.value;

        let filtered = allMembers.filter(m => {
            const matchesSearch = (m.username || '').toLowerCase().includes(queryText) ||
                (m.email || '').toLowerCase().includes(queryText);

            const role = m.role || 'trainee';
            let matchesRole = true;
            if (roleValue !== 'all') {
                if (roleValue === 'leader') matchesRole = (role === 'leader' || role === 'co-leader');
                else matchesRole = role === roleValue;
            }

            return matchesSearch && matchesRole;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (sortValue === 'points-desc') return (b.points || 0) - (a.points || 0);
            if (sortValue === 'points-asc') return (a.points || 0) - (b.points || 0);
            if (sortValue === 'progress-desc') return (b.weeklyProgress?.count || 0) - (a.weeklyProgress?.count || 0);
            // Simple logic for newest assuming added order or if date exists
            return 0;
        });

        if (filtered.length === 0) {
            membersList.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            membersList.classList.remove('hidden');
            renderGrid(filtered); // Default to grid for now
        }
    }

    function renderGrid(members) {
        membersList.innerHTML = '';
        membersList.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5";

        const currentUser = allMembers.find(m => m.id === auth.currentUser.uid);
        const currentUserPoints = currentUser?.points || 0;
        const viewThreshold = settings.colleagueViewPoints;

        members.forEach((member, index) => {
            const isSelf = member.id === auth.currentUser.uid;
            const canView = isSelf || (currentUserPoints >= viewThreshold);

            // Logic for Rank
            const rankInfo = getRankInfo(member.role || 'trainee');
            const weeklyCount = member.weeklyProgress?.count || 0;
            const weeklyTarget = settings.weeklyTarget;
            const progressPercent = Math.min(100, Math.round((weeklyCount / weeklyTarget) * 100));

            // Top 3 Badge
            let medal = '';
            if (index === 0 && sortSelect.value === 'points-desc') medal = '<span class="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full shadow-sm text-lg z-10"><i class="fas fa-crown"></i></span>';

            const card = document.createElement('div');
            card.className = "bg-white dark:bg-dark-card rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-700 hover:-translate-y-1 hover:shadow-card transition-all duration-300 relative group cursor-pointer overflow-hidden";

            card.innerHTML = `
                ${medal}
                <!-- Card Header -->
                <div class="flex items-start justify-between mb-4">
                     <div class="relative">
                        <img src="${member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username)}&background=${rankInfo.color.replace('#', '')}&color=fff`}" 
                             class="w-16 h-16 rounded-2xl object-cover shadow-md ring-2 ring-white dark:ring-gray-700 group-hover:ring-${rankInfo.twColor}-400 transition-all">
                        <div class="absolute -bottom-2 -right-2 bg-white dark:bg-dark-card p-1 rounded-lg shadow-sm">
                            <div class="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style="background-color: ${rankInfo.color}">
                                <i class="${rankInfo.icon}"></i>
                            </div>
                        </div>
                     </div>
                     <div class="text-left">
                         <span class="inline-block px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300">
                            Lvl ${Math.floor((member.points || 0) / 100) + 1}
                         </span>
                     </div>
                </div>

                <!-- Content -->
                <div class="mb-4">
                    <h3 class="font-bold text-gray-900 dark:text-white text-lg truncate mb-1">${member.username}</h3>
                    <p class="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full" style="background-color: ${rankInfo.color}"></span>
                        ${rankInfo.name}
                    </p>
                </div>

                <!-- Progress Bar -->
                <div class="mb-4">
                    <div class="flex justify-between text-xs mb-1">
                        <span class="text-gray-500">التحدي الأسبوعي</span>
                        <span class="font-bold ${progressPercent >= 100 ? 'text-green-600' : 'text-brand-600'}">${weeklyCount}/${weeklyTarget}</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-1000 ${progressPercent >= 100 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-brand-600 to-brand-400'}" 
                             style="width: ${progressPercent}%"></div>
                    </div>
                </div>

                <!-- Footer Stats -->
                <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div class="text-center">
                        <p class="text-[10px] text-gray-400 uppercase">النقاط</p>
                        <p class="font-bold text-gray-900 dark:text-white">${member.points || 0}</p>
                    </div>
                     <div class="w-px h-6 bg-gray-100 dark:bg-gray-700"></div>
                     <div class="text-center">
                        <p class="text-[10px] text-gray-400 uppercase">المنشورات</p>
                        <p class="font-bold text-gray-900 dark:text-white">${member.stats?.approvedSubmissions || 0}</p>
                    </div>
                     <div class="w-px h-6 bg-gray-100 dark:bg-gray-700"></div>
                     <button class="view-profile p-2 rounded-lg bg-gray-50 hover:bg-brand-50 text-gray-400 hover:text-brand-600 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors" title="عرض الملف">
                        <i class="${canView ? 'fas fa-arrow-left' : 'fas fa-lock'}"></i>
                     </button>
                </div>
             `;

            membersList.appendChild(card);

            // Click Event
            card.addEventListener('click', () => {
                if (canView) {
                    showMemberDetails(member, rankInfo);
                } else {
                    Swal.fire({
                        icon: 'lock',
                        title: 'الملف مقفول',
                        text: `يجب أن تصل إلى ${viewThreshold} نقطة لفتح ملفات زملائك`,
                        confirmButtonText: 'حسناً',
                        customClass: {
                            popup: 'dark:bg-dark-card dark:text-white',
                            confirmButton: 'bg-brand-600'
                        }
                    });
                }
            });
        });
    }

    function showMemberDetails(member, rankInfo) {
        document.getElementById('modal-avatar').src = member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username)}&background=random`;
        document.getElementById('modal-name').innerText = member.username || 'مستخدم';

        const rankEl = document.getElementById('modal-rank');
        rankEl.innerText = rankInfo.name;
        rankEl.style.color = rankInfo.color;
        rankEl.style.backgroundColor = `${rankInfo.color}15`; // 15 is hex for ~8% opacity

        document.getElementById('modal-points').innerText = member.points || 0;
        const level = Math.floor((member.points || 0) / 100) + 1;
        document.getElementById('modal-level').innerText = level;

        document.getElementById('modal-email').innerText = member.email;
        document.getElementById('modal-phone').innerText = member.phoneNumber || 'غير متوفر';

        document.getElementById('modal-academic').innerText = member.academicYear || 'غير محدد';
        document.getElementById('modal-specialty').innerText = member.specialty || 'غير محدد';

        // Badge
        const badgeContainer = document.getElementById('modal-badge-container');
        badgeContainer.innerHTML = `
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-md" style="background-color: ${rankInfo.color}">
                <i class="${rankInfo.icon}"></i>
            </div>
        `;

        // Social Links
        const socialContainer = document.getElementById('modal-social');
        socialContainer.innerHTML = '';
        if (member.socialLinks) {
            const platforms = [
                { id: 'facebook', icon: 'fab fa-facebook-f', color: '#1877F2' },
                { id: 'twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
                { id: 'instagram', icon: 'fab fa-instagram', color: '#E1306C' },
                { id: 'whatsapp', icon: 'fab fa-whatsapp', color: '#25D366' }
            ];

            let hasLinks = false;
            platforms.forEach(p => {
                const url = member.socialLinks[p.id];
                if (url) {
                    hasLinks = true;
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = "_blank";
                    a.className = `w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform`;
                    a.style.backgroundColor = p.color;
                    a.innerHTML = `<i class="${p.icon}"></i>`;
                    socialContainer.appendChild(a);
                }
            });

            if (!hasLinks) {
                socialContainer.innerHTML = '<p class="text-sm text-gray-400">لا توجد روابط تواصل</p>';
            }
        } else {
            socialContainer.innerHTML = '<p class="text-sm text-gray-400">لا توجد روابط تواصل</p>';
        }

        const detailsModal = document.getElementById('member-details-modal');
        detailsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function getRankInfo(role) {
        const ranks = {
            'leader': { name: 'قائد الفريق', color: '#9333ea', twColor: 'purple', icon: 'fas fa-crown' },
            'co-leader': { name: 'نائب القائد', color: '#eab308', twColor: 'yellow', icon: 'fas fa-star' },
            'senior': { name: 'مشرف أول', color: '#3b82f6', twColor: 'blue', icon: 'fas fa-shield-alt' },
            'moderator': { name: 'مشرف', color: '#10b981', twColor: 'green', icon: 'fas fa-user-shield' },
            'trainee': { name: 'متدرب', color: '#6b7280', twColor: 'gray', icon: 'fas fa-user' }
        };
        return ranks[role] || ranks['trainee'];
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}
