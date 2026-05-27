package com.hms.modules.record.service;

import com.hms.modules.record.dto.MedicalRecordDTO;

import java.util.List;

public interface MedicalRecordService {
    
    MedicalRecordDTO createMedicalRecord(MedicalRecordDTO medicalRecordDTO);
    
    MedicalRecordDTO getMedicalRecordById(Long id);
    
    List<MedicalRecordDTO> getMedicalRecordsByPatientId(Long patientId);
    
    List<MedicalRecordDTO> getMedicalRecordsByDoctorId(Long doctorId);
    
    List<MedicalRecordDTO> getAllMedicalRecords();
    
    void deleteMedicalRecord(Long id);
}
