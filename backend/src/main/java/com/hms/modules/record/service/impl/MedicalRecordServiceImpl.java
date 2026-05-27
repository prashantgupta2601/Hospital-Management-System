package com.hms.modules.record.service.impl;

import com.hms.common.exception.ResourceNotFoundException;
import com.hms.modules.doctor.entity.Doctor;
import com.hms.modules.doctor.repository.DoctorRepository;
import com.hms.modules.notification.dto.NotificationMessage;
import com.hms.modules.notification.service.NotificationService;
import com.hms.modules.patient.entity.Patient;
import com.hms.modules.patient.repository.PatientRepository;
import com.hms.modules.record.dto.MedicalRecordDTO;
import com.hms.modules.record.entity.MedicalRecord;
import com.hms.modules.record.repository.MedicalRecordRepository;
import com.hms.modules.record.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public MedicalRecordDTO createMedicalRecord(MedicalRecordDTO dto) {
        // Validate file uploads before persist
        validateLabReport(dto.getLabReportName(), dto.getLabReportData());

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));

        MedicalRecord record = mapToEntity(dto, patient, doctor);
        record.setCreatedBy(getCurrentAuditor()); // Populate Audit
        
        MedicalRecord savedRecord = medicalRecordRepository.save(record);
        MedicalRecordDTO result = mapToDTO(savedRecord);

        // Broadcast real-time notification
        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(NotificationMessage.Type.MEDICAL_RECORD_CREATED)
                .title("New Medical Record Added")
                .message(String.format("Medical record and prescriptions uploaded for %s by Dr. %s",
                        patient.getName(), doctor.getName()))
                .entityId(savedRecord.getId())
                .build());

        return result;
    }

    @Override
    public MedicalRecordDTO getMedicalRecordById(Long id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + id));
        return mapToDTO(record);
    }

    @Override
    public List<MedicalRecordDTO> getMedicalRecordsByPatientId(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByVisitDateDesc(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<MedicalRecordDTO> getMedicalRecordsByDoctorId(Long doctorId) {
        return medicalRecordRepository.findByDoctorIdOrderByVisitDateDesc(doctorId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<MedicalRecordDTO> getAllMedicalRecords() {
        return medicalRecordRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteMedicalRecord(Long id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + id));
        medicalRecordRepository.delete(record);
    }

    private MedicalRecordDTO mapToDTO(MedicalRecord record) {
        return MedicalRecordDTO.builder()
                .id(record.getId())
                .patientId(record.getPatient().getId())
                .patientName(record.getPatient().getName())
                .doctorId(record.getDoctor().getId())
                .doctorName(record.getDoctor().getName())
                .visitDate(record.getVisitDate())
                .diagnosis(record.getDiagnosis())
                .treatment(record.getTreatment())
                .prescriptions(record.getPrescriptions())
                .labReportName(record.getLabReportName())
                .labReportData(record.getLabReportData())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }

    private MedicalRecord mapToEntity(MedicalRecordDTO dto, Patient patient, Doctor doctor) {
        return MedicalRecord.builder()
                .id(dto.getId())
                .patient(patient)
                .doctor(doctor)
                .visitDate(dto.getVisitDate())
                .diagnosis(dto.getDiagnosis())
                .treatment(dto.getTreatment())
                .prescriptions(dto.getPrescriptions())
                .labReportName(dto.getLabReportName())
                .labReportData(dto.getLabReportData())
                .build();
    }

    private void validateLabReport(String labReportName, String labReportData) {
        if (labReportData == null || labReportData.trim().isEmpty()) {
            return; // No file uploaded
        }

        if (labReportName == null || labReportName.trim().isEmpty()) {
            throw new IllegalArgumentException("Lab report name cannot be empty when file data is present");
        }
        
        String lowerName = labReportName.toLowerCase();
        if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".png") && !lowerName.endsWith(".jpg") && !lowerName.endsWith(".jpeg")) {
            throw new IllegalArgumentException("Invalid file type. Only PDF, PNG, and JPG/JPEG files are allowed.");
        }

        if (!labReportData.startsWith("data:application/pdf;base64,") &&
            !labReportData.startsWith("data:image/png;base64,") &&
            !labReportData.startsWith("data:image/jpeg;base64,") &&
            !labReportData.startsWith("data:image/jpg;base64,")) {
            throw new IllegalArgumentException("Unapproved file content or invalid base64 encoding prefix.");
        }

        int commaIndex = labReportData.indexOf(",");
        if (commaIndex == -1) {
            throw new IllegalArgumentException("Malformed base64 file data.");
        }
        String base64Content = labReportData.substring(commaIndex + 1);
        
        long calculatedSize = (base64Content.length() * 3) / 4;
        long maxSizeLimit = 5 * 1024 * 1024; // 5MB
        
        if (calculatedSize > maxSizeLimit) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 5MB.");
        }
    }

    private String getCurrentAuditor() {
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "SYSTEM";
    }
}
