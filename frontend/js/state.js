/**
 * HMS Lightweight Central State Management
 * Handles response caching, concurrent request deduplication, and optimistic update rollbacks.
 */

const AppState = {
    // Memory Cache
    cache: {
        patients: null,
        doctors: null,
        appointments: null,
        analytics: null,
        records: null,
        shifts: null
    },

    // Cache timestamps (last fetched)
    lastFetch: {
        patients: 0,
        doctors: 0,
        appointments: 0,
        analytics: 0,
        records: 0,
        shifts: 0
    },

    // Active fetching promises to coalesce duplicate calls
    fetchPromises: {
        patients: null,
        doctors: null,
        appointments: null,
        analytics: null,
        records: null,
        shifts: null
    },

    // Cache duration: 30 seconds
    cacheTTL: 30000,

    // Backup state for rollback actions
    backups: {
        patients: null,
        doctors: null,
        appointments: null
    },

    // ─── Patients Caching & Getters ──────────────────────────────────────────
    async getPatients(forceFetch = false) {
        const now = Date.now();
        const isCacheValid = this.cache.patients && (now - this.lastFetch.patients < this.cacheTTL);

        if (isCacheValid && !forceFetch) {
            console.log('[AppState] Returning cached patients');
            return { data: this.cache.patients };
        }

        // Coalesce concurrent calls
        if (this.fetchPromises.patients) {
            console.log('[AppState] Deduplicating patients fetch...');
            return this.fetchPromises.patients;
        }

        console.log('[AppState] Fetching patients from API...');
        this.fetchPromises.patients = (async () => {
            try {
                const response = await PatientAPI.getAll();
                this.cache.patients = response.data;
                this.lastFetch.patients = Date.now();
                return response;
            } finally {
                this.fetchPromises.patients = null;
            }
        })();

        return this.fetchPromises.patients;
    },

    // ─── Doctors Caching & Getters ───────────────────────────────────────────
    async getDoctors(forceFetch = false) {
        const now = Date.now();
        const isCacheValid = this.cache.doctors && (now - this.lastFetch.doctors < this.cacheTTL);

        if (isCacheValid && !forceFetch) {
            console.log('[AppState] Returning cached doctors');
            return { data: this.cache.doctors };
        }

        if (this.fetchPromises.doctors) {
            console.log('[AppState] Deduplicating doctors fetch...');
            return this.fetchPromises.doctors;
        }

        console.log('[AppState] Fetching doctors from API...');
        this.fetchPromises.doctors = (async () => {
            try {
                const response = await DoctorAPI.getAll();
                this.cache.doctors = response.data;
                this.lastFetch.doctors = Date.now();
                return response;
            } finally {
                this.fetchPromises.doctors = null;
            }
        })();

        return this.fetchPromises.doctors;
    },

    // ─── Appointments Caching & Getters ──────────────────────────────────────
    async getAppointments(forceFetch = false) {
        const now = Date.now();
        const isCacheValid = this.cache.appointments && (now - this.lastFetch.appointments < this.cacheTTL);

        if (isCacheValid && !forceFetch) {
            console.log('[AppState] Returning cached appointments');
            return { data: this.cache.appointments };
        }

        if (this.fetchPromises.appointments) {
            console.log('[AppState] Deduplicating appointments fetch...');
            return this.fetchPromises.appointments;
        }

        console.log('[AppState] Fetching appointments from API...');
        this.fetchPromises.appointments = (async () => {
            try {
                const response = await AppointmentAPI.getAll();
                this.cache.appointments = response.data;
                this.lastFetch.appointments = Date.now();
                return response;
            } finally {
                this.fetchPromises.appointments = null;
            }
        })();

        return this.fetchPromises.appointments;
    },

    // ─── Analytics Caching & Getters ─────────────────────────────────────────
    async getAnalytics(forceFetch = false) {
        const now = Date.now();
        const isCacheValid = this.cache.analytics && (now - this.lastFetch.analytics < this.cacheTTL);

        if (isCacheValid && !forceFetch) {
            console.log('[AppState] Returning cached analytics');
            return { data: this.cache.analytics };
        }

        if (this.fetchPromises.analytics) {
            console.log('[AppState] Deduplicating analytics fetch...');
            return this.fetchPromises.analytics;
        }

        console.log('[AppState] Fetching analytics from API...');
        this.fetchPromises.analytics = (async () => {
            try {
                const response = await AnalyticsAPI.getSummary();
                this.cache.analytics = response.data;
                this.lastFetch.analytics = Date.now();
                return response;
            } finally {
                this.fetchPromises.analytics = null;
            }
        })();
        return this.fetchPromises.analytics;
    },

    // ─── Medical Records Caching & Getters ────────────────────────────────────
    async getRecords(forceFetch = false) {
        const now = Date.now();
        const isCacheValid = this.cache.records && (now - this.lastFetch.records < this.cacheTTL);

        if (isCacheValid && !forceFetch) {
            console.log('[AppState] Returning cached records');
            return { data: this.cache.records };
        }

        if (this.fetchPromises.records) {
            console.log('[AppState] Deduplicating records fetch...');
            return this.fetchPromises.records;
        }

        console.log('[AppState] Fetching medical records from API...');
        this.fetchPromises.records = (async () => {
            try {
                const response = await MedicalRecordAPI.getAll();
                this.cache.records = response.data;
                this.lastFetch.records = Date.now();
                return response;
            } finally {
                this.fetchPromises.records = null;
            }
        })();

        return this.fetchPromises.records;
    },

    // ─── Shifts Caching & Getters ─────────────────────────────────────────────
    async getShifts(forceFetch = false) {
        const now = Date.now();
        const isCacheValid = this.cache.shifts && (now - this.lastFetch.shifts < this.cacheTTL);

        if (isCacheValid && !forceFetch) {
            console.log('[AppState] Returning cached shifts');
            return { data: this.cache.shifts };
        }

        if (this.fetchPromises.shifts) {
            console.log('[AppState] Deduplicating shifts fetch...');
            return this.fetchPromises.shifts;
        }

        console.log('[AppState] Fetching shifts from API...');
        this.fetchPromises.shifts = (async () => {
            try {
                const response = await ShiftAPI.getAll();
                this.cache.shifts = response.data;
                this.lastFetch.shifts = Date.now();
                return response;
            } finally {
                this.fetchPromises.shifts = null;
            }
        })();

        return this.fetchPromises.shifts;
    },

    // ─── Cache Invalidation & Mutations ──────────────────────────────────────
    invalidate(moduleName) {
        console.log(`[AppState] Invalidating cache for ${moduleName}`);
        this.cache[moduleName] = null;
        this.lastFetch[moduleName] = 0;
    },

    invalidateAll() {
        this.invalidate('patients');
        this.invalidate('doctors');
        this.invalidate('appointments');
        this.invalidate('analytics');
        this.invalidate('records');
        this.invalidate('shifts');
    },

    // ─── Optimistic Mutations & Rollbacks ────────────────────────────────────
    addPatientOptimistic(patient) {
        console.log('[AppState] Applying optimistic patient update:', patient);
        // Create deep copy backup
        this.backups.patients = this.cache.patients ? [...this.cache.patients] : [];
        
        if (!this.cache.patients) {
            this.cache.patients = [];
        }
        // Inject at the beginning
        this.cache.patients.unshift(patient);
    },

    rollbackPatients() {
        if (this.backups.patients !== null) {
            console.warn('[AppState] Rolling back patients state due to API failure...');
            this.cache.patients = this.backups.patients;
            this.backups.patients = null;
        }
    },

    confirmPatient(tempId, realPatient) {
        console.log('[AppState] Confirming patient update:', tempId, '->', realPatient.id);
        if (this.cache.patients) {
            const index = this.cache.patients.findIndex(p => p.id === tempId);
            if (index !== -1) {
                this.cache.patients[index] = realPatient;
            }
        }
        this.backups.patients = null;
    },

    addAppointmentOptimistic(appointment) {
        console.log('[AppState] Applying optimistic appointment update:', appointment);
        this.backups.appointments = this.cache.appointments ? [...this.cache.appointments] : [];

        if (!this.cache.appointments) {
            this.cache.appointments = [];
        }
        this.cache.appointments.unshift(appointment);
    },

    rollbackAppointments() {
        if (this.backups.appointments !== null) {
            console.warn('[AppState] Rolling back appointments state due to API failure...');
            this.cache.appointments = this.backups.appointments;
            this.backups.appointments = null;
        }
    },

    confirmAppointment(tempId, realAppointment) {
        console.log('[AppState] Confirming appointment update:', tempId, '->', realAppointment.id);
        if (this.cache.appointments) {
            const index = this.cache.appointments.findIndex(a => a.id === tempId);
            if (index !== -1) {
                this.cache.appointments[index] = realAppointment;
            }
        }
        this.backups.appointments = null;
    }
};

window.AppState = AppState;
