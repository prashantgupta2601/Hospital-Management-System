package com.hms.modules.analytics.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnalyticsSummaryDTO {
    private DashboardStatsDTO stats;
    private List<AppointmentsPerDayDTO> appointmentsPerDay;
    private List<DoctorWorkloadDTO> doctorWorkload;
    private List<PatientGrowthDTO> patientGrowth;
}
