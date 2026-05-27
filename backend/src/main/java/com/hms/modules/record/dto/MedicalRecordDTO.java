package com.hms.modules.record.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDTO {
    
    private Long id;
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    private String patientName;
    
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    
    private String doctorName;
    
    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;
    
    @NotNull(message = "Diagnosis is required")
    private String diagnosis;
    
    private String treatment;
    
    private String prescriptions;
    
    private String labReportName;
    
    private String labReportData;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
