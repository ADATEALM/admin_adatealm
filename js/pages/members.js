import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function renderMembers() {
    return `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">الأعضاء</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">قائمة جميع المشرفين في الفريق</p>
                </div>
                <div class="flex gap-2">
                    <button id="filter-all" class="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold transition-colors">
                        الكل
                    </button>
                    <button id="filter-new" class="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                        المنضمون حديثاً
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                            <i class="fas fa-users text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">إجمالي الأعضاء</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="total-members">...</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                            <i class="fas fa-user-plus text-green-600 dark:text-green-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">منضمون حديثاً</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="new-members">...</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
                            <i class="fas fa-fire text-yellow-600 dark:text-yellow-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">نشطون</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="active-members">...</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                            <i class="fas fa-crown text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">قادة</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="leaders">...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Members List -->
            <div id="members-list" class="space-y-3">
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>جاري تحميل الأعضاء...</p>
                </div>
            </div>

            <!-- Member Details Modal -->
            <div id="member-details-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" id="close-details-overlay"></div>
                <div class="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl shadow-2xl transform transition-all animate-fade-in overflow-hidden">
                    <div class="relative h-32 bg-gradient-to-r from-brand-500 to-brand-600">
                        <button id="close-details-btn" class="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="px-6 pb-6 relative">
                        <div class="-mt-12 mb-4">
                            <img id="modal-avatar" src="" class="w-24 h-24 rounded-full border-4 border-white dark:border-dark-card shadow-lg bg-white object-cover">
                        </div>
                        <h3 id="modal-name" class="text-xl font-bold text-gray-900 dark:text-white mb-1">...</h3>
                        <p id="modal-hashtag" class="text-brand-600 font-mono text-sm mb-4">@...</p>
                        
                        <div class="space-y-3">
                            <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <span id="modal-email" class="text-sm select-all">...</span>
                            </div>
                            <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                    <i class="fas fa-phone"></i>
                                </div>
                                <span id="modal-phone" class="text-sm select-all">...</span>
                            </div>
                            <div id="modal-social" class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <!-- Social Links Injected Here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initMembers() {
    const membersList = document.getElementById('members-list');
    let allMembers = [];
    let currentFilter = 'all';

    // Filter buttons
    const filterAll = document.getElementById('filter-all');
    const filterNew = document.getElementById('filter-new');

    filterAll.addEventListener('click', () => {
        currentFilter = 'all';
        filterAll.classList.add('bg-brand-600', 'text-white');
        filterAll.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        filterNew.classList.remove('bg-brand-600', 'text-white');
        filterNew.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        renderMembersList(allMembers, currentFilter);
    });

    filterNew.addEventListener('click', () => {
        currentFilter = 'new';
        filterNew.classList.add('bg-brand-600', 'text-white');
        filterNew.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        filterAll.classList.remove('bg-brand-600', 'text-white');
        filterAll.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        renderMembersList(allMembers, currentFilter);
    });

    try {
        // Fetch all users
        const usersQuery = query(collection(db, "users"), orderBy("points", "desc"));
        const querySnapshot = await getDocs(usersQuery);

        allMembers = [];
        querySnapshot.forEach((doc) => {
            allMembers.push({ id: doc.id, ...doc.data() });
        });

        // Update stats
        document.getElementById('total-members').innerText = allMembers.length;
        const newMembers = allMembers.filter(m => m.points === 0);
        document.getElementById('new-members').innerText = newMembers.length;
        const activeMembers = allMembers.filter(m => m.points > 0);
        document.getElementById('active-members').innerText = activeMembers.length;
        const leaders = allMembers.filter(m => m.role === 'leader' || m.role === 'co-leader');
        document.getElementById('leaders').innerText = leaders.length;

        renderMembersList(allMembers, currentFilter);

    } catch (error) {
        console.error("Error loading members:", error);
        membersList.innerHTML = `<p class="text-red-500 text-center">خطأ: ${error.message}</p>`;
    }

    // Modal Closing Logic
    const detailsModal = document.getElementById('member-details-modal');
    const closeOverlay = document.getElementById('close-details-overlay');
    const closeBtn = document.getElementById('close-details-btn');
    const closeDetails = () => detailsModal.classList.add('hidden');

    if (closeOverlay) closeOverlay.addEventListener('click', closeDetails);
    if (closeBtn) closeBtn.addEventListener('click', closeDetails);


    async function renderMembersList(members, filter) {
        let filteredMembers = members;

        // Settings & Permissions
        let colleaguePoints = 100;
        let currentUserPoints = 0;

        try {
            const settingsSnap = await getDoc(doc(db, "settings", "global"));
            if (settingsSnap.exists()) colleaguePoints = settingsSnap.data().colleagueViewPoints || 100;

            const currentUser = members.find(m => m.id === auth.currentUser.uid);
            if (currentUser) currentUserPoints = currentUser.points || 0;
        } catch (e) { console.log('Error fetching settings for list', e); }

        if (filter === 'new') {
            filteredMembers = members.filter(m => m.points === 0);
        }

        if (filteredMembers.length === 0) {
            membersList.innerHTML = `
                <div class="text-center text-gray-400 py-12 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-700">
                    <i class="fas fa-user-friends text-5xl mb-3 text-gray-200 dark:text-gray-700"></i>
                    <p class="text-lg font-medium">لا يوجد أعضاء ${filter === 'new' ? 'جدد' : ''}</p>
                </div>
            `;
            return;
        }

        membersList.innerHTML = '';

        filteredMembers.forEach(member => {
            const isNew = member.points === 0;
            const rankIcon = getRankIcon(member.role || 'trainee');
            const rankColor = getRankColor(member.role || 'trainee');
            const rankName = getRankName(member.role || 'trainee');
            const level = Math.floor((member.points || 0) / 100) || 1;
            const weeklyProgress = member.weeklyProgress?.count || 0;
            const canView = (currentUserPoints >= colleaguePoints) || (member.id === auth.currentUser.uid); // Can always view self

            const item = document.createElement('div');
            // Make card clickable if viewing is allowed, or show lock if not
            item.className = `bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative group cursor-pointer ${isNew ? 'border-r-4 border-r-green-500' : ''}`;

            // Render Card Content
            item.innerHTML = `
                    <div class="flex items-center gap-4">
                        <!-- Rank Badge -->
                        <div class="flex-shrink-0">
                            <div class="relative">
                                <img src="${member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username || 'User')}&background=${rankColor.replace('#', '')}&color=fff&size=64`}" 
                                     class="w-16 h-16 rounded-full ring-4 ring-${rankColor}/20 object-cover" alt="${member.username}">
                                ${isNew ? '<span class="absolute -top-1 -right-1 flex h-5 w-5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-green-500 items-center justify-center text-white text-xs font-bold">N</span></span>' : ''}
                            </div>
                        </div>

                        <!-- Member Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="font-bold text-gray-900 dark:text-white truncate">${member.username || 'مستخدم'}</h3>
                                ${isNew ? '<span class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">جديد</span>' : ''}
                            </div>
                            <div class="flex items-center gap-3 text-sm">
                                <span class="flex items-center gap-1 text-${rankColor}">
                                    <i class="${rankIcon}"></i>
                                    <span class="font-medium">${rankName}</span>
                                </span>
                                <span class="text-gray-400">•</span>
                                <span class="text-gray-500 dark:text-gray-400">المستوى ${level}</span>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="hidden md:flex items-center gap-6">
                            <div class="text-center">
                                <p class="text-xs text-gray-500 dark:text-gray-400">النقاط</p>
                                <p class="text-lg font-bold ${isNew ? 'text-gray-400' : 'text-yellow-600'}">${member.points || 0}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-gray-500 dark:text-gray-400">هذا الأسبوع</p>
                                <p class="text-lg font-bold text-brand-600">${weeklyProgress}/20</p>
                            </div>
                        </div>

                        <!-- Actions (Three Dots) -->
                        <div class="flex-shrink-0 relative">
                            <button class="three-dots-btn w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors z-10 relative">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div class="dropdown-menu hidden absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20">
                                <button class="view-profile-btn w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                    <i class="${canView ? 'fas fa-id-card text-brand-600' : 'fas fa-lock text-gray-400'}"></i>
                                    <span>عرض الملف الشخصي</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Stats -->
                    <div class="md:hidden flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div class="flex-1 text-center">
                            <p class="text-xs text-gray-500 dark:text-gray-400">النقاط</p>
                            <p class="text-base font-bold ${isNew ? 'text-gray-400' : 'text-yellow-600'}">${member.points || 0}</p>
                        </div>
                        <div class="flex-1 text-center">
                            <p class="text-xs text-gray-500 dark:text-gray-400">هذا الأسبوع</p>
                            <p class="text-base font-bold text-brand-600">${weeklyProgress}/20</p>
                        </div>
                    </div>
            `;

            membersList.appendChild(item);

            // Event Handlers
            const threeDotsBtn = item.querySelector('.three-dots-btn');
            const dropdownMenu = item.querySelector('.dropdown-menu');
            const viewProfileBtn = item.querySelector('.view-profile-btn');

            // Handle Card Click (View Profile)
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking the menu button
                if (e.target.closest('.three-dots-btn')) return;

                if (canView) {
                    showMemberDetails(member);
                } else {
                    window.showToast(`تحتاج إلى ${colleaguePoints} نقطة لفتح ملفات الزملاء`, 'warning');
                }
            });

            // Handle Menu Toggle
            threeDotsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click

                // Close all other open dropdowns
                document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(menu => {
                    if (menu !== dropdownMenu) menu.classList.add('hidden');
                });

                dropdownMenu.classList.toggle('hidden');
            });

            // Handle "View Profile" Menu Item
            viewProfileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.add('hidden');

                if (canView) {
                    showMemberDetails(member);
                } else {
                    window.showToast(`تحتاج إلى ${colleaguePoints} نقطة لفتح ملفات الزملاء`, 'warning');
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!item.contains(e.target)) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        });
    }

    function showMemberDetails(member) {
        document.getElementById('modal-avatar').src = member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username)}&background=random`;
        document.getElementById('modal-name').innerText = member.displayName || member.username;
        document.getElementById('modal-hashtag').innerText = member.username ? `#${member.username}` : '---';
        document.getElementById('modal-email').innerText = member.email;
        document.getElementById('modal-phone').innerText = member.phoneNumber || 'غير متوفر';

        const socialContainer = document.getElementById('modal-social');
        socialContainer.innerHTML = '';
        if (member.socialLinks) {
            const platforms = [
                { id: 'facebook', icon: 'fab fa-facebook', color: 'text-blue-600' },
                { id: 'twitter', icon: 'fab fa-twitter', color: 'text-sky-500' },
                { id: 'instagram', icon: 'fab fa-instagram', color: 'text-pink-600' },
                { id: 'linkedin', icon: 'fab fa-linkedin', color: 'text-blue-700' },
                { id: 'github', icon: 'fab fa-github', color: 'text-gray-900' }
            ];

            platforms.forEach(p => {
                const url = member.socialLinks[p.id];
                if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = "_blank";
                    a.className = `p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${p.color}`;
                    a.innerHTML = `<i class="${p.icon}"></i>`;
                    socialContainer.appendChild(a);
                }
            });
        }

        detailsModal.classList.remove('hidden');
    }

    function getRankIcon(role) {
        const icons = {
            'leader': 'fas fa-crown',
            'co-leader': 'fas fa-star',
            'senior': 'fas fa-shield-alt',
            'moderator': 'fas fa-user-shield',
            'trainee': 'fas fa-user'
        };
        return icons[role] || icons['trainee'];
    }

    function getRankColor(role) {
        const colors = {
            'leader': '#9333ea',
            'co-leader': '#eab308',
            'senior': '#3b82f6',
            'moderator': '#10b981',
            'trainee': '#6b7280'
        };
        return colors[role] || colors['trainee'];
    }

    function getRankName(role) {
        const names = {
            'leader': 'قائد',
            'co-leader': 'نائب القائد',
            'senior': 'مشرف أول',
            'moderator': 'مشرف',
            'trainee': 'متدرب'
        };
        return names[role] || names['trainee'];
    }
}
