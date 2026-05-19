package com.hms.modules.patient.repository;

import com.hms.modules.patient.entity.Patient;
import com.hms.modules.analytics.dto.PatientGrowthDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);

    @Query("SELECT new com.hms.modules.analytics.dto.PatientGrowthDTO(FUNCTION('DATE', p.createdAt), COUNT(p)) " +
           "FROM Patient p " +
           "GROUP BY FUNCTION('DATE', p.createdAt) " +
           "ORDER BY FUNCTION('DATE', p.createdAt) ASC")
    List<PatientGrowthDTO> getPatientGrowth();
}
