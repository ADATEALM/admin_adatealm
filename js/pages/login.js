import { login, signup } from '../auth.js';

export function renderLogin() {
    return `
        <div class="min-h-[80vh] flex items-center justify-center -mt-10 animate-fade-in">
            <div class="bg-white dark:bg-dark-card w-full max-w-md p-8 rounded-3xl shadow-card border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                 <!-- Decor -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                
                <div class="text-center mb-8 relative z-10">
                     <div class="w-16 h-16 mx-auto bg-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg mb-4 transform rotate-3">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">تطبيق المشرفين</h2>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">قم بتسجيل الدخول لمتابعة عملك</p>
                </div>

                <!-- Tabs -->
                <div class="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 relative z-10">
                    <button id="tab-login" class="flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-all duration-300">
                        تسجيل دخول
                    </button>
                    <button id="tab-signup" class="flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300">
                        حساب جديد
                    </button>
                </div>

                <!-- Login Form -->
                <form id="login-form" class="space-y-4 relative z-10">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                        <div class="relative">
                             <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="far fa-envelope"></i>
                            </div>
                            <input type="email" id="email" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="user@example.com" required>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="fas fa-lock"></i>
                            </div>
                            <input type="password" id="password" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="••••••••" required>
                        </div>
                    </div>
                    
                    <button type="submit" id="login-btn" class="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all">
                        تسجيل الدخول
                    </button>
                </form>

                <!-- Signup Form (Hidden) -->
                <form id="signup-form" class="space-y-4 relative z-10 hidden">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المستخدم</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="far fa-user"></i>
                            </div>
                            <input type="text" id="new-username" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="اسمك في الفريق" required>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                        <div class="relative">
                             <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="far fa-envelope"></i>
                            </div>
                            <input type="email" id="new-email" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="user@example.com" required>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="fas fa-lock"></i>
                            </div>
                            <input type="password" id="new-password" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="••••••••" required>
                        </div>
                    </div>
                    
                    <button type="submit" id="signup-btn" class="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all">
                        إنشاء حساب
                    </button>
                </form>

            </div>
        </div>
    `;
}

export function initLogin() {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Check if auth is available (it should be)
    // console.log("Login Init");

    // Tab Switching
    tabLogin.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabLogin.classList.remove('text-gray-500', 'dark:text-gray-400');
        tabSignup.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabSignup.classList.add('text-gray-500', 'dark:text-gray-400');
    });

    tabSignup.addEventListener('click', () => {
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        tabSignup.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabSignup.classList.remove('text-gray-500', 'dark:text-gray-400');
        tabLogin.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabLogin.classList.add('text-gray-500', 'dark:text-gray-400');
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('login-btn');

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
        btn.disabled = true;

        try {
            await login(email, password);
            // Auth observer in app.js will handle redirect
        } catch (error) {
            console.error(error);
            alert("فشل تسجيل الدخول: " + error.message);
            btn.innerHTML = 'تسجيل الدخول';
            btn.disabled = false;
        }
    });

    // Handle Signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const username = document.getElementById('new-username').value;
        const btn = document.getElementById('signup-btn');

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
        btn.disabled = true;

        try {
            await signup(email, password, username);
            // Auth observer will handle redirect
        } catch (error) {
            console.error(error);
            alert("فشل إنشاء الحساب: " + error.message);
            btn.innerHTML = 'إنشاء حساب';
            btn.disabled = false;
        }
    });
}
