document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen on initial load
    document.querySelector('.loading-screen').classList.add('hidden');

    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Show loading
        document.querySelector('.loading-screen').classList.remove('hidden');

        // Check credentials
        if (username === 'hr@company.name' && password === '123') {
            // Set authentication in localStorage
            localStorage.setItem('isAuthenticated', 'true');
            // Redirect to main page
            window.location.href = '/';
        } else {
            alert('Invalid credentials. Please try again.');
            document.querySelector('.loading-screen').classList.add('hidden');
        }
    });
});
