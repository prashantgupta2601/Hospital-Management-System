const WebSocketService = {
    stompClient: null,

    connect: function() {
        if (!AuthService.isLoggedIn()) return;

        console.log("Connecting to WebSocket...");
        // Use SockJS fallback if browser doesn't support WebSocket natively
        const socket = new SockJS('http://localhost:8081/ws');
        this.stompClient = Stomp.over(socket);
        
        // Disable excessive STOMP debug logs
        this.stompClient.debug = null;

        const token = AuthService.getToken();
        
        this.stompClient.connect({'Authorization': `Bearer ${token}`}, frame => {
            console.log('Connected to WebSocket');
            
            // Subscribe to global notifications
            this.stompClient.subscribe('/topic/notifications', message => {
                const data = JSON.parse(message.body);
                console.log('Live Notification:', data);
                // Don't show toast for PINGs
                if (data.type !== 'GENERAL' || data.title !== 'Pong') {
                    this.showToast(data.title, data.message, 'bg-info');
                }
            });

            // Subscribe to appointment updates
            this.stompClient.subscribe('/topic/appointments', message => {
                const data = JSON.parse(message.body);
                console.log('Live Appointment Update:', data);
                
                let colorClass = 'bg-primary';
                if (data.type === 'APPOINTMENT_CANCELLED') colorClass = 'bg-danger';
                if (data.type === 'APPOINTMENT_COMPLETED') colorClass = 'bg-success';
                
                this.showToast(data.title, data.message, colorClass);
                
                // Refresh table if we are on the appointments page
                if (typeof loadAppointments === 'function') {
                    loadAppointments();
                }
                // Refresh dashboard stats if we are on index
                if (typeof loadDashboardStats === 'function') {
                    loadDashboardStats();
                }
            });

        }, error => {
            console.error('WebSocket connection error:', error);
            // Auto reconnect after 5s
            setTimeout(() => this.connect(), 5000);
        });
    },

    disconnect: function() {
        if (this.stompClient !== null) {
            this.stompClient.disconnect();
        }
        console.log("Disconnected from WebSocket");
    },

    showToast: function(title, message, headerClass = 'bg-primary') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'toast border-0 shadow-lg';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="toast-header ${headerClass} text-white border-0">
                <i class="fas fa-bell me-2"></i>
                <strong class="me-auto">${title}</strong>
                <small>Just now</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: 6000 });
        toast.show();
        
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
};

// Auto-connect when the page loads if logged in
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AuthService !== 'undefined' && AuthService.isLoggedIn()) {
        WebSocketService.connect();
    }
});
