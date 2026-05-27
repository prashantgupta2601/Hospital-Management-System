package com.hms.modules.shift.service;

import com.hms.modules.shift.dto.DoctorShiftDTO;

import java.util.List;

public interface DoctorShiftService {
    
    DoctorShiftDTO createShift(DoctorShiftDTO dto);
    
    DoctorShiftDTO updateShift(Long id, DoctorShiftDTO dto);
    
    List<DoctorShiftDTO> getAllShifts();
    
    List<DoctorShiftDTO> getShiftsByDoctorId(Long doctorId);
    
    List<DoctorShiftDTO> getShiftsByDepartment(String department);
    
    void deleteShift(Long id);
}
