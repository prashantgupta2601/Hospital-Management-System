package com.hms.modules.analytics.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PatientGrowthDTO {
    private LocalDate date;
    private Long count;
}
