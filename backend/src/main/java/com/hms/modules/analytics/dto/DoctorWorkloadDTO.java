package com.hms.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorWorkloadDTO {
    private String doctorName;
    private Long count;
}
