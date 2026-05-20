package com.hms.modules.analytics.dto;

import java.time.LocalDate;
import java.time.ZoneId;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PatientGrowthDTO {
    private LocalDate date;
    private Long count;

    public PatientGrowthDTO(LocalDate date, Long count) {
        this.date = date;
        this.count = count;
    }

    public PatientGrowthDTO(java.sql.Date date, Long count) {
        this.date = date != null ? date.toLocalDate() : null;
        this.count = count;
    }

    public PatientGrowthDTO(java.util.Date date, Long count) {
        if (date instanceof java.sql.Date) {
            this.date = ((java.sql.Date) date).toLocalDate();
        } else {
            this.date = date != null ? date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate() : null;
        }
        this.count = count;
    }

    public PatientGrowthDTO(Object date, Long count) {
        if (date instanceof LocalDate) {
            this.date = (LocalDate) date;
        } else if (date instanceof java.sql.Date) {
            this.date = ((java.sql.Date) date).toLocalDate();
        } else if (date instanceof java.util.Date) {
            this.date = ((java.util.Date) date).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        } else if (date != null) {
            try {
                this.date = LocalDate.parse(date.toString());
            } catch (Exception e) {
                this.date = null;
            }
        }
        this.count = count;
    }
}
