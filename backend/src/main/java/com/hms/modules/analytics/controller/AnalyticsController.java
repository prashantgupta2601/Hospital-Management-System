package com.hms.modules.analytics.controller;

import com.hms.modules.analytics.dto.*;
import com.hms.modules.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/appointments-per-day")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<AppointmentsPerDayDTO>> getAppointmentsPerDay() {
        return ResponseEntity.ok(analyticsService.getAppointmentsPerDay());
    }

    @GetMapping("/doctor-workload")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<DoctorWorkloadDTO>> getDoctorWorkload() {
        return ResponseEntity.ok(analyticsService.getDoctorWorkload());
    }

    @GetMapping("/patient-growth")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<PatientGrowthDTO>> getPatientGrowth() {
        return ResponseEntity.ok(analyticsService.getPatientGrowth());
    }

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<AnalyticsSummaryDTO> getAnalyticsSummary() {
        return ResponseEntity.ok(analyticsService.getAnalyticsSummary());
    }
}
