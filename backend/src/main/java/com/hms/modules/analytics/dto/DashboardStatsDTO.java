package com.hms.modules.analytics.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDTO {
    private Long totalPatients;
    private Long activeDoctors;
    private Long totalAppointments;
    private BigDecimal totalRevenue;
}
