package com.hms.modules.shift.repository;

import com.hms.modules.shift.entity.DoctorShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorShiftRepository extends JpaRepository<DoctorShift, Long> {
    
    List<DoctorShift> findByDoctorId(Long doctorId);
    
    List<DoctorShift> findByDepartment(String department);
}
