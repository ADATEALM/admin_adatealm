import { auth, db } from '../firebase-config.js';
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { logout } from '../auth.js';

export function renderProfile() {
    return `
        <div class="animate-fade-in space-y-6">
            <!-- Header -->
            <div class="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 group-hover:bg-white/15 transition-all duration-700"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
                <div class="relative z-10">
                    <h1 class="text-3xl font-bold mb-2 tracking-tight">الملف الشخصي</h1>
                    <p class="text-brand-100/90 text-sm font-medium">إدارة هويتك الرقمية ومتابعة إنجازاتك</p>
                </div>
            </div>

            <!-- Profile Completion Widget -->
            <div class="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hidden" id="completion-widget">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-gray-900 dark:text-white text-sm">
                        <i class="fas fa-tasks text-brand-500 ml-2"></i>اكمال الملف الشخصي
                    </h3>
                    <span class="text-brand-600 font-bold text-sm" id="completion-percent">0%</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div id="completion-bar" class="bg-gradient-to-r from-brand-500 to-brand-400 h-2.5 rounded-full transition-all duration-1000" style="width: 0%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-2" id="completion-message">أكمل بياناتك لتحصل على وسام "الملف الذهبي"!</p>
            </div>

            <!-- Profile Card -->
            <div class="bg-white dark:bg-dark-card rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <!-- ... existing cover ... -->
                <div class="relative h-48 bg-gradient-to-r from-brand-500 via-blue-500 to-indigo-600">
                    <div class="absolute inset-0 bg-pattern opacity-10"></div>
                    <div class="absolute -bottom-16 right-8">
                        <div class="relative group">
                            <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
                            <img id="profile-avatar" src="" alt="Avatar" class="relative w-32 h-32 rounded-2xl ring-4 ring-white dark:ring-gray-800 shadow-2xl object-cover bg-white dark:bg-gray-800">
                            <button id="change-avatar-btn" class="absolute bottom-2 left-2 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-xl shadow-lg transition-all transform hover:scale-110 active:scale-95 backdrop-blur-sm">
                                <i class="fas fa-camera text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Profile Info -->
                <div class="pt-20 px-8 pb-8">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                        <div>
                            <h2 id="profile-display-name" class="text-3xl font-bold text-gray-900 dark:text-white mb-2">...</h2>
                            <div class="flex flex-wrap items-center gap-3">
                                <span class="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-mono text-sm font-semibold border border-brand-100 dark:border-brand-800/50">
                                    <i class="fas fa-hashtag text-xs opacity-70 ml-1"></i><span id="profile-username">...</span>
                                </span>
                                <span id="profile-academic-wrapper" class="hidden px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-100 dark:border-indigo-800/50">
                                    <i class="fas fa-graduation-cap ml-1.5 opacity-70"></i><span id="profile-academic-year"></span>
                                </span>
                            </div>
                            <p id="profile-email" class="text-gray-500 dark:text-gray-400 text-sm mt-2 opacity-80">...</p>
                            <p id="profile-bio" class="text-gray-600 dark:text-gray-300 text-sm mt-3 max-w-2xl leading-relaxed hidden">...</p>
                            
                            <!-- Social Links Display -->
                            <div class="flex items-center gap-3 mt-4" id="social-links-display">
                                <!-- Icons injected via JS -->
                            </div>
                        </div>
                        <button id="edit-profile-btn" class="group px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0">
                            <span class="flex items-center gap-2">
                                <i class="fas fa-pen-to-square group-hover:rotate-12 transition-transform"></i>
                                <span>تعديل البيانات</span>
                            </span>
                        </button>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <!-- Points -->
                        <div class="relative overflow-hidden p-5 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <i class="fas fa-star text-4xl text-yellow-500"></i>
                            </div>
                            <div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1" id="profile-points">0</div>
                            <div class="text-xs font-semibold text-yellow-700 dark:text-yellow-500 tracking-wide">النقاط الكلية</div>
                        </div>

                        <!-- Level -->
                        <div class="relative overflow-hidden p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/10 dark:to-fuchsia-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30 group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <i class="fas fa-layer-group text-4xl text-purple-500"></i>
                            </div>
                            <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1" id="profile-level">1</div>
                            <div class="text-xs font-semibold text-purple-700 dark:text-purple-500 tracking-wide">المستوى</div>
                        </div>

                        <!-- Rank -->
                        <div class="relative overflow-hidden p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <i class="fas fa-shield-alt text-4xl text-green-500"></i>
                            </div>
                            <div class="text-xl font-bold text-green-600 dark:text-green-400 mb-1 truncate" id="profile-rank">متدرب</div>
                            <div class="text-xs font-semibold text-green-700 dark:text-green-500 tracking-wide">الرتبة الحالية</div>
                        </div>

                        <!-- Weekly -->
                        <div class="relative overflow-hidden p-5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 group hover:shadow-md transition-shadow">
                            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <i class="fas fa-fire text-4xl text-orange-500"></i>
                            </div>
                            <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1" id="profile-weekly">0/20</div>
                            <div class="text-xs font-semibold text-orange-700 dark:text-orange-500 tracking-wide">التقدم الأسبوعي</div>
                        </div>
                    </div>

                    <!-- Badges Section -->
                    <div id="badges-section" class="hidden mb-8">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <i class="fas fa-medal text-brand-500"></i>
                            الأوسمة والإنجازات
                        </h3>
                        <div class="flex flex-wrap gap-4" id="badges-container">
                            <!-- Badges will be injected here -->
                        </div>
                    </div>

                    <!-- Advanced Statistics Card -->
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <i class="fas fa-chart-pie text-xl"></i>
                            </div>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">إحصائيات الأداء</h3>
                        </div>
                        
                        <div class="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                            <!-- Total Submissions -->
                            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                    <i class="fas fa-upload"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-gray-900 dark:text-white" id="stat-total-submissions">0</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">إجمالي المشاركات</div>
                                </div>
                            </div>

                            <!-- Approved -->
                            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500">
                                    <i class="fas fa-check"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-green-600" id="stat-approved">0</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">مقبولة</div>
                                </div>
                            </div>

                            <!-- Rejected -->
                            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                    <i class="fas fa-times"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-red-600" id="stat-rejected">0</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">مرفوضة</div>
                                </div>
                            </div>

                            <!-- Success Rate -->
                            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                    <i class="fas fa-percentage"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-purple-600" id="stat-success-rate">0%</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">نسبة القبول</div>
                                </div>
                            </div>

                            <!-- Days Since Joining -->
                            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                    <i class="fas fa-calendar-day"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-indigo-600" id="stat-days-joined">0</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">يوماً معنا</div>
                                </div>
                            </div>

                            <!-- Streak -->
                            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                                    <i class="fas fa-fire-alt"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-bold text-orange-600" id="stat-streak">0</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">أيام متتالية</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Telegram VIP Group Button -->
                    <div id="telegram-vip-section" class="hidden mb-6">
                        <a href="https://t.me/+SkOYOSnH20ZkNzRk" target="_blank" class="block group relative overflow-hidden p-6 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 rounded-2xl shadow-lg transition-all transform hover:scale-[1.01]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                            <div class="relative flex items-center justify-between text-white">
                                <div class="flex items-center gap-4">
                                    <div class="bg-white/20 p-3.5 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                        <i class="fab fa-telegram text-3xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg">مجموعة الدماء البيضاء VIP</h3>
                                        <p class="text-blue-100 text-sm">مكافأة لتميزك! انضم للنخبة الآن</p>
                                    </div>
                                </div>
                                <div class="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:translate-x-1 transition-transform">
                                    <i class="fas fa-arrow-left"></i>
                                </div>
                            </div>
                        </a>
                    </div>

                    <!-- Contact & Info List -->
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <i class="fas fa-phone"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">رقم الهاتف مرتبط</p>
                                    <p id="profile-phone" class="font-medium text-gray-900 dark:text-white mt-0.5">...</p>
                                </div>
                            </div>
                            <i class="fas fa-check-circle text-green-500 opacity-50"></i>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <i class="fas fa-calendar text-gray-400"></i>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">تاريخ الانضمام</p>
                                    <p id="profile-joined" class="text-sm font-medium text-gray-900 dark:text-white mt-0.5">...</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <i class="fas fa-clock text-gray-400"></i>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">آخر ظهور</p>
                                    <p id="profile-last-login" class="text-sm font-medium text-gray-900 dark:text-white mt-0.5">...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Logout -->
            <button id="logout-btn" class="w-full mt-4 p-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 transition-all font-bold flex items-center justify-center gap-2 group">
                <i class="fas fa-sign-out-alt group-hover:-translate-x-1 transition-transform"></i>
                <span>تسجيل الخروج من الحساب</span>
            </button>
        </div>

        <!-- Edit Profile Modal -->
         <div id="edit-modal" class="hidden fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" id="close-modal-overlay"></div>
            
            <div class="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
                <!-- Sticky Header -->
                <div class="sticky top-0 bg-white/95 dark:bg-dark-card/95 backdrop-blur-sm z-10 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</h3>
                    <button id="close-modal-btn" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div class="p-6">
                    <form id="edit-profile-form" class="space-y-5">
                        <!-- Photo Section -->
                        <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <img id="form-avatar-preview" src="" class="w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-gray-700">
                            <div class="flex-1">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صورة الملف الشخصي</label>
                                <div class="flex gap-2">
                                    <input type="url" id="edit-photo-url" class="block w-full text-sm p-2 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-shadow" placeholder="https://example.com/photo.jpg">
                                    <button type="button" id="trigger-upload-btn" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                        <i class="fas fa-upload"></i>
                                    </button>
                                </div>
                                <p class="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-start gap-1">
                                    <i class="fas fa-exclamation-triangle mt-0.5"></i>
                                    <span>تنبيه: نرجو عدم وضع صور شخصية حقيقية (خاصة للأخوات) حفاظاً على الخصوصية. يفضل استخدام صور رمزية أو افاتار.</span>
                                </p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="col-span-1 sm:col-span-2">
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الاسم الكامل</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fas fa-user-tag"></i>
                                    </div>
                                    <input type="text" id="edit-display-name" class="block w-full pr-10 p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all font-medium" placeholder="أحمد محمد" required>
                                </div>
                            </div>

                            <div class="col-span-1 sm:col-span-2">
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    الاسم الرمزي (Hashtag)
                                    <span class="text-xs font-normal text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full mr-2">يستخدم للبحث والمنشن</span>
                                </label>
                                <div class="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:border-brand-500 transition-all">
                                    <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <span class="text-gray-500 font-bold text-lg">#</span>
                                    </div>
                                    <input type="text" id="edit-username" class="block w-full pr-8 pl-4 py-3 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white font-mono dir-ltr placeholder:text-right" placeholder="lion_heart" required pattern="[a-zA-Z0-9_]+"  style="direction: ltr; text-align: left;">
                                </div>
                                <div class="flex justify-between items-start mt-1.5 px-1">
                                    <p class="text-xs text-gray-500">استخدم الإنجليزية، الأرقام، والشرطة السفلية (_) فقط</p>
                                    <p id="username-availability" class="text-xs font-medium min-h-[1.25em]"></p>
                                </div>
                            </div>

                            <!-- Bio -->
                            <div class="col-span-1 sm:col-span-2">
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نبذة عني (Bio)</label>
                                <textarea id="edit-bio" rows="3" class="block w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all resize-none" placeholder="اكتب نبذة مختصرة عن نفسك..."></textarea>
                            </div>

                            <!-- Academic Year -->
                            <div class="col-span-1 sm:col-span-2">
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">السنة الدراسية</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fas fa-graduation-cap"></i>
                                    </div>
                                    <input type="text" id="edit-academic-year" class="block w-full pr-10 p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all" placeholder="مثال: الثالث ثانوي، جامعي..." list="academic-years-list">
                                    <datalist id="academic-years-list">
                                        <option value="الأول متوسط">
                                        <option value="الثاني متوسط">
                                        <option value="الثالث متوسط">
                                        <option value="الأول ثانوي">
                                        <option value="الثاني ثانوي">
                                        <option value="الثالث ثانوي">
                                        <option value="جامعي">
                                        <option value="خريج">
                                    </datalist>
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div class="col-span-1 sm:col-span-2">
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fas fa-phone-alt"></i>
                                    </div>
                                    <input type="tel" id="edit-phone" class="block w-full pr-10 p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-all font-mono" placeholder="05XXXXXXXX" dir="ltr" style="text-align: right;">
                                </div>
                            </div>

                            <!-- Social Links -->
                            <div class="col-span-1 sm:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                    <i class="fas fa-share-alt ml-1 text-brand-500"></i> روابط التواصل الاجتماعي
                                </h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400"><i class="fab fa-facebook"></i></div>
                                        <input type="url" id="edit-social-facebook" class="block w-full pr-10 p-2.5 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs" placeholder="Facebook URL">
                                    </div>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400"><i class="fab fa-twitter"></i></div>
                                        <input type="url" id="edit-social-twitter" class="block w-full pr-10 p-2.5 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs" placeholder="Twitter/X URL">
                                    </div>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400"><i class="fab fa-instagram"></i></div>
                                        <input type="url" id="edit-social-instagram" class="block w-full pr-10 p-2.5 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs" placeholder="Instagram URL">
                                    </div>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400"><i class="fab fa-linkedin"></i></div>
                                        <input type="url" id="edit-social-linkedin" class="block w-full pr-10 p-2.5 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs" placeholder="LinkedIn URL">
                                    </div>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400"><i class="fab fa-github"></i></div>
                                        <input type="url" id="edit-social-github" class="block w-full pr-10 p-2.5 rounded-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs" placeholder="GitHub URL">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                            <button type="button" id="cancel-edit-btn" class="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors w-1/3">
                                إلغاء
                            </button>
                            <button type="submit" id="save-profile-btn" class="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-brand-500/30 flex justify-center items-center">
                                <span class="btn-text">حفظ التغييرات</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Change Avatar Modal (Simplified) -->
        <input type="file" id="avatar-upload-input" accept="image/*" class="hidden">
    `;
}

export async function initProfile() {
    const user = auth.currentUser;
    if (!user) {
        window.location.hash = 'login';
        return;
    }

    try {
        // Load user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Update UI Helpers
        const updateElementText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };
        const updateElementSrc = (id, src) => {
            const el = document.getElementById(id);
            if (el) el.src = src;
        };

        // --- Basic Info Update ---
        const avatar = userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=0ea5e9&color=fff`;
        updateElementSrc('profile-avatar', avatar);

        updateElementText('profile-display-name', userData.displayName || user.displayName || 'مستخدم');
        updateElementText('profile-username', `${userData.username || 'user'}`);
        updateElementText('profile-email', user.email);
        updateElementText('profile-phone', userData.phoneNumber || 'غير محدد');

        // Bio Logic
        if (userData.bio) {
            updateElementText('profile-bio', userData.bio);
            document.getElementById('profile-bio').classList.remove('hidden');
        } else {
            document.getElementById('profile-bio').classList.add('hidden');
        }

        // Social Links Logic
        const socialLinks = userData.socialLinks || {};
        const socialContainer = document.getElementById('social-links-display');
        socialContainer.innerHTML = '';

        const platforms = [
            { id: 'facebook', icon: 'fab fa-facebook', color: 'text-blue-600' },
            { id: 'twitter', icon: 'fab fa-twitter', color: 'text-sky-500' },
            { id: 'instagram', icon: 'fab fa-instagram', color: 'text-pink-600' },
            { id: 'linkedin', icon: 'fab fa-linkedin', color: 'text-blue-700' },
            { id: 'github', icon: 'fab fa-github', color: 'text-gray-900 dark:text-gray-100' }
        ];

        let hasSocial = false;
        platforms.forEach(p => {
            if (socialLinks[p.id]) {
                const link = document.createElement('a');
                link.href = socialLinks[p.id];
                link.target = "_blank";
                link.className = `p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-transform hover:scale-110 ${p.color}`;
                link.innerHTML = `<i class="${p.icon} text-xl"></i>`;
                socialContainer.appendChild(link);
                hasSocial = true;
            }
        });
        if (!hasSocial) socialContainer.classList.add('hidden');
        else socialContainer.classList.remove('hidden');


        // --- Profile Completion Logic ---
        const checkField = (val) => val && val.length > 0 && val !== '...';
        const fields = [
            { val: userData.displayName, weight: 10 },
            { val: userData.username, weight: 10 },
            { val: userData.photoURL && !userData.photoURL.includes('ui-avatars.com'), weight: 15 },
            { val: userData.bio, weight: 20 },
            { val: userData.academicYear, weight: 15 },
            { val: userData.phoneNumber, weight: 15 },
            { val: Object.keys(socialLinks).length > 0, weight: 15 }
        ];

        const completion = fields.reduce((acc, curr) => curr.val ? acc + curr.weight : acc, 0);
        const finalCompletion = Math.min(100, completion);

        document.getElementById('completion-percent').innerText = `${finalCompletion}%`;
        document.getElementById('completion-bar').style.width = `${finalCompletion}%`;
        document.getElementById('completion-widget').classList.remove('hidden');

        if (finalCompletion === 100) {
            document.getElementById('completion-message').innerText = "رائع! ملفك الشخصي مكتمل تماماً 🎉";
            document.getElementById('completion-message').className = "text-xs text-green-600 font-bold mt-2";
        }


        // Academic Year Logic
        if (userData.academicYear) {
            updateElementText('profile-academic-year', userData.academicYear);
            document.getElementById('profile-academic-wrapper').classList.remove('hidden');
            document.getElementById('profile-academic-wrapper').classList.add('flex', 'items-center');
        } else {
            document.getElementById('profile-academic-wrapper').classList.add('hidden');
        }

        // Badges Logic
        if (userData.badges && userData.badges.length > 0) {
            const badgesContainer = document.getElementById('badges-container');
            badgesContainer.innerHTML = userData.badges.map(badge => `
                <div class="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-lg border border-yellow-200 dark:border-yellow-800/50" title="${badge.description || ''}">
                    <i class="${badge.icon || 'fas fa-medal'}"></i>
                    <span class="text-sm font-bold">${badge.name}</span>
                </div>
            `).join('');
            document.getElementById('badges-section').classList.remove('hidden');
        }

        // Stats
        updateElementText('profile-points', userData.points || 0);
        updateElementText('profile-level', userData.level || 1);
        updateElementText('profile-rank', userData.rank || 'متدرب');
        // Fetch Global Settings for Weekly Target
        let weeklyTarget = 20;
        try {
            const settingsSnap = await getDoc(doc(db, "settings", "global"));
            if (settingsSnap.exists()) {
                weeklyTarget = settingsSnap.data().weeklyTarget || 20;
            }
        } catch (e) { console.log("Error loading target", e); }

        updateElementText('profile-weekly', `${userData.weeklyProgress?.count || 0}/${weeklyTarget}`);

        if (userData.createdAt) updateElementText('profile-joined', new Date(userData.createdAt.toDate()).toLocaleDateString('ar-EG'));
        if (userData.lastLogin) updateElementText('profile-last-login', new Date(userData.lastLogin.toDate()).toLocaleDateString('ar-EG'));

        // --- Telegram VIP Check ---
        try {
            const settingsDoc = await getDoc(doc(db, "settings", "global"));
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                const requiredPoints = settings.telegramGroupPoints || 500;
                if ((userData.points || 0) >= requiredPoints) {
                    document.getElementById('telegram-vip-section').classList.remove('hidden');
                }
            }
        } catch (e) { console.error("VIP check error:", e); }

        // --- Advanced Stats ---
        const stats = userData.stats || {};
        const total = (stats.approvedSubmissions || 0) + (stats.rejectedSubmissions || 0);
        const approved = stats.approvedSubmissions || 0;
        const successRate = total > 0 ? Math.round((approved / total) * 100) : 0;
        const daysJoined = userData.createdAt ? Math.floor((new Date() - userData.createdAt.toDate()) / (1000 * 60 * 60 * 24)) : 0;

        updateElementText('stat-total-submissions', total);
        updateElementText('stat-approved', approved);
        updateElementText('stat-rejected', stats.rejectedSubmissions || 0);
        updateElementText('stat-success-rate', `${successRate}%`);
        updateElementText('stat-days-joined', daysJoined);
        updateElementText('stat-streak', stats.currentStreak || 0);


        // --- Editing Logic ---
        const editModal = document.getElementById('edit-modal');
        const editBtn = document.getElementById('edit-profile-btn');
        const closeModals = () => {
            editModal.classList.add('hidden');
            editModal.classList.remove('flex');
        };

        // Open Edit Modal
        editBtn.addEventListener('click', () => {
            document.getElementById('edit-display-name').value = userData.displayName || user.displayName || '';
            document.getElementById('edit-username').value = userData.username || '';
            document.getElementById('edit-phone').value = userData.phoneNumber || '';
            document.getElementById('edit-academic-year').value = userData.academicYear || '';
            document.getElementById('edit-photo-url').value = userData.photoURL || '';
            document.getElementById('edit-bio').value = userData.bio || '';
            document.getElementById('form-avatar-preview').src = userData.photoURL || avatar;

            // Populate Social Inputs
            const links = userData.socialLinks || {};
            document.getElementById('edit-social-facebook').value = links.facebook || '';
            document.getElementById('edit-social-twitter').value = links.twitter || '';
            document.getElementById('edit-social-instagram').value = links.instagram || '';
            document.getElementById('edit-social-linkedin').value = links.linkedin || '';
            document.getElementById('edit-social-github').value = links.github || '';

            editModal.classList.remove('hidden');
            editModal.classList.add('flex');
            document.getElementById('username-availability').innerText = ''; // Reset status
        });

        // Close Handlers
        document.getElementById('close-modal-btn').addEventListener('click', closeModals);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeModals);
        document.getElementById('close-modal-overlay').addEventListener('click', closeModals);

        // Photo URL Preview
        const photoInput = document.getElementById('edit-photo-url');
        photoInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url && url.length > 10) {
                document.getElementById('form-avatar-preview').src = url;
            }
        });

        // Username Check
        const usernameInput = document.getElementById('edit-username');
        const availabilityMsg = document.getElementById('username-availability');

        usernameInput.addEventListener('input', async (e) => {
            const username = e.target.value.toLowerCase().trim();
            // Validate characters
            if (!/^[a-z0-9_]*$/.test(username)) {
                availabilityMsg.className = 'text-xs font-medium text-red-500';
                availabilityMsg.innerText = 'أحرف إنجليزية، أرقام، و _ فقط';
                return;
            }

            if (username.length < 3) {
                availabilityMsg.innerText = '';
                return;
            }

            if (username === (userData.username || '').toLowerCase()) {
                availabilityMsg.className = 'text-xs font-medium text-green-600';
                availabilityMsg.innerText = 'هذا هو اسمك الحالي';
                return;
            }

            // Debounce DB check could be good here, but for now direct check:
            try {
                const q = query(collection(db, "users"), where("username", "==", username));
                const snap = await getDocs(q);
                if (snap.empty) {
                    availabilityMsg.className = 'text-xs font-medium text-green-600';
                    availabilityMsg.innerText = 'الاسم متاح ✓';
                } else {
                    availabilityMsg.className = 'text-xs font-medium text-red-500';
                    availabilityMsg.innerText = 'الاسم مستخدم بالفعل ✗';
                }
            } catch (e) {
                console.error(e);
            }
        });


        // Save Form
        const editForm = document.getElementById('edit-profile-form');
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-profile-btn');
            const originalBtnText = btn.innerHTML;

            const newName = document.getElementById('edit-display-name').value.trim();
            const newUsername = document.getElementById('edit-username').value.toLowerCase().trim();
            const newPhone = document.getElementById('edit-phone').value.trim();
            const newAcademic = document.getElementById('edit-academic-year').value.trim();
            const newBio = document.getElementById('edit-bio').value.trim();
            const newPhoto = document.getElementById('edit-photo-url').value.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=0ea5e9&color=fff`;

            // Collect Social Links
            const newSocialLinks = {
                facebook: document.getElementById('edit-social-facebook').value.trim(),
                twitter: document.getElementById('edit-social-twitter').value.trim(),
                instagram: document.getElementById('edit-social-instagram').value.trim(),
                linkedin: document.getElementById('edit-social-linkedin').value.trim(),
                github: document.getElementById('edit-social-github').value.trim()
            };

            // Remove empty keys
            Object.keys(newSocialLinks).forEach(k => !newSocialLinks[k] && delete newSocialLinks[k]);

            // Basic Validation
            if (newUsername.length < 3) return window.showToast('الاسم الرمزي قصير جداً', 'error');

            // Unique Check if changed
            if (newUsername !== (userData.username || '').toLowerCase()) {
                const q = query(collection(db, "users"), where("username", "==", newUsername));
                if (!(await getDocs(q)).empty) {
                    return window.showToast('عذراً، الاسم الرمزي محجوز.', 'error');
                }
            }

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            try {
                // Update Auth
                await updateProfile(user, { displayName: newName, photoURL: newPhoto });

                // Update Firestore
                await updateDoc(doc(db, "users", user.uid), {
                    displayName: newName,
                    username: newUsername,
                    phoneNumber: newPhone,
                    academicYear: newAcademic,
                    bio: newBio,
                    photoURL: newPhoto,
                    socialLinks: newSocialLinks
                    // If these don't exist, we don't want to wipe them, so we only update specific fields
                    // But if it's a new user doc creation (unlikely here but possible), we rely on merge behavior of some libs, 
                    // but updateDoc fails if doc doesn't exist. We checked existence at start.
                });

                // Reflect Changes Locally without reload
                updateElementText('profile-display-name', newName);
                updateElementText('profile-username', newUsername);
                updateElementText('profile-phone', newPhone || 'غير محدد');

                if (newBio) {
                    updateElementText('profile-bio', newBio);
                    document.getElementById('profile-bio').classList.remove('hidden');
                } else {
                    document.getElementById('profile-bio').classList.add('hidden');
                }

                if (newAcademic) {
                    updateElementText('profile-academic-year', newAcademic);
                    document.getElementById('profile-academic-wrapper').classList.remove('hidden');
                    document.getElementById('profile-academic-wrapper').classList.add('flex', 'items-center');
                } else {
                    document.getElementById('profile-academic-wrapper').classList.add('hidden');
                }

                document.getElementById('profile-avatar').src = newPhoto;

                // Update cached data object for next edit & re-render checks
                userData.displayName = newName;
                userData.username = newUsername;
                userData.phoneNumber = newPhone;
                userData.academicYear = newAcademic;
                userData.bio = newBio;
                userData.photoURL = newPhoto;
                userData.socialLinks = newSocialLinks;

                // Re-run initProfile partial logic? Easier to just reload or manually update complex widgets.
                // We should re-render social links manually here to avoid full reload
                // (Copy-paste logic from above or extract function? Let's inline for safety)

                const socialContainer = document.getElementById('social-links-display');
                socialContainer.innerHTML = '';
                let hasSocial = false;
                platforms.forEach(p => {
                    if (newSocialLinks[p.id]) {
                        const link = document.createElement('a');
                        link.href = newSocialLinks[p.id];
                        link.target = "_blank";
                        link.className = `p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-transform hover:scale-110 ${p.color}`;
                        link.innerHTML = `<i class="${p.icon} text-xl"></i>`;
                        socialContainer.appendChild(link);
                        hasSocial = true;
                    }
                });
                if (!hasSocial) socialContainer.classList.add('hidden');
                else socialContainer.classList.remove('hidden');

                // Recalculate Completion Widget
                // ... same completion logic ...
                // Can't easily invoke "checkField" if strict scope, but we defined it inside initProfile scope.
                // We will just re-calc here.
                const completionFields = [
                    { val: newName, weight: 10 },
                    { val: newUsername, weight: 10 },
                    { val: newPhoto && !newPhoto.includes('ui-avatars.com'), weight: 15 },
                    { val: newBio, weight: 20 },
                    { val: newAcademic, weight: 15 },
                    { val: newPhone, weight: 15 },
                    { val: Object.keys(newSocialLinks).length > 0, weight: 15 }
                ];
                const completion = completionFields.reduce((acc, curr) => (curr.val && curr.val.length > 0) ? acc + curr.weight : acc, 0);
                const finalCompletion = Math.min(100, completion);
                document.getElementById('completion-percent').innerText = `${finalCompletion}%`;
                document.getElementById('completion-bar').style.width = `${finalCompletion}%`;
                if (finalCompletion === 100) {
                    document.getElementById('completion-message').innerText = "رائع! ملفك الشخصي مكتمل تماماً 🎉";
                    document.getElementById('completion-message').className = "text-xs text-green-600 font-bold mt-2";
                } else {
                    document.getElementById('completion-message').innerText = "أكمل ملفك الشخصي لتحصل على أقصى استفادة!";
                    document.getElementById('completion-message').className = "text-xs text-blue-600 mt-2";
                }


                closeModals();
                window.showToast('تم حفظ التغييرات بنجاح', 'success');
            } catch (err) {
                console.error(err);
                window.showToast('حدث خطأ أثناء الحفظ: ' + err.message, 'error');
            } finally {
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            }
        });


        // Quick Avatar Change Button
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const fileInput = document.getElementById('avatar-upload-input');
        const uploadBtn = document.getElementById('trigger-upload-btn'); // Inside modal

        // Helper to handle upload
        const handleImageUpload = async (file) => {
            if (!file) return;

            // Show loading
            window.showToast('جاري رفع الصورة...', 'info');

            try {
                const url = await uploadImageToImgBB(file);

                // If we are in the modal (triggered by uploadBtn)
                const editModal = document.getElementById('edit-modal');
                if (!editModal.classList.contains('hidden')) {
                    document.getElementById('edit-photo-url').value = url;
                    document.getElementById('form-avatar-preview').src = url;
                    window.showToast('تم رفع الصورة بنجاح', 'success');
                } else {
                    // Triggered from Profile Card -> Direct Update? 
                    // Let's open modal and prefill
                    editBtn.click();
                    setTimeout(() => {
                        document.getElementById('edit-photo-url').value = url;
                        document.getElementById('form-avatar-preview').src = url;
                        window.showToast('تم رفع الصورة! اضغط حفظ لاعتمادها.', 'success');
                    }, 100);
                }
            } catch (error) {
                console.error(error);
                window.showToast('فشل رفع الصورة: ' + error.message, 'error');
            }
        };

        changeAvatarBtn.addEventListener('click', () => fileInput.click());
        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleImageUpload(file);
            // Reset input so same file can be selected again if needed
            e.target.value = '';
        });


    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

async function uploadImageToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', "db5343488b3526fe64fb53550dcb74c2");

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`ImgBB upload failed with status ${response.status}`);
        const result = await response.json();
        if (result.success) return result.data.url;
        else throw new Error(`ImgBB Error: ${result.error.message}`);
    } catch (e) {
        throw new Error("تعذر الاتصال بخدمة رفع الصور");
    }
}
