package com.hms.modules.record.repository;

import com.hms.modules.record.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    
    List<MedicalRecord> findByPatientIdOrderByVisitDateDesc(Long patientId);
    
    List<MedicalRecord> findByDoctorIdOrderByVisitDateDesc(Long doctorId);
}
