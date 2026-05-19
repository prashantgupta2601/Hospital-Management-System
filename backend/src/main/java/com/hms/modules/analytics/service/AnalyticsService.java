package com.hms.modules.analytics.service;

import com.hms.modules.analytics.dto.*;
import java.util.List;

public interface AnalyticsService {
    List<AppointmentsPerDayDTO> getAppointmentsPerDay();
    List<DoctorWorkloadDTO> getDoctorWorkload();
    List<PatientGrowthDTO> getPatientGrowth();
    DashboardStatsDTO getDashboardStats();
    AnalyticsSummaryDTO getAnalyticsSummary();
}
