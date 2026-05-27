package com.hms.modules.record.entity;

import com.hms.modules.doctor.entity.Doctor;
import com.hms.modules.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "medical_records")
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false, length = 1000)
    private String diagnosis;

    @Column(length = 2000)
    private String treatment;

    @Column(length = 2000)
    private String prescriptions; // JSON or formatted text of medications

    private String labReportName;

    @Column(columnDefinition = "TEXT")
    private String labReportData; // base64 representation of mock PDF/image report

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
