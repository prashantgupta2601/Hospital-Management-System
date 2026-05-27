package com.hms.modules.shift.service.impl;

import com.hms.common.exception.ResourceNotFoundException;
import com.hms.modules.doctor.entity.Doctor;
import com.hms.modules.doctor.repository.DoctorRepository;
import com.hms.modules.notification.dto.NotificationMessage;
import com.hms.modules.notification.service.NotificationService;
import com.hms.modules.shift.dto.DoctorShiftDTO;
import com.hms.modules.shift.entity.DoctorShift;
import com.hms.modules.shift.entity.ShiftStatus;
import com.hms.modules.shift.repository.DoctorShiftRepository;
import com.hms.modules.shift.service.DoctorShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorShiftServiceImpl implements DoctorShiftService {

    private final DoctorShiftRepository doctorShiftRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public DoctorShiftDTO createShift(DoctorShiftDTO dto) {
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));

        DoctorShift shift = mapToEntity(dto, doctor);
        if (shift.getStatus() == null) {
            shift.setStatus(ShiftStatus.ACTIVE);
        }
        
        DoctorShift savedShift = doctorShiftRepository.save(shift);
        DoctorShiftDTO result = mapToDTO(savedShift);

        // Real-time broadcast
        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(NotificationMessage.Type.SHIFT_UPDATED)
                .title("New Shift Scheduled")
                .message(String.format("New shift assigned to Dr. %s for %s (%s - %s)",
                        doctor.getName(), savedShift.getDayOfWeek(), savedShift.getStartTime(), savedShift.getEndTime()))
                .entityId(savedShift.getId())
                .build());

        return result;
    }

    @Override
    @Transactional
    public DoctorShiftDTO updateShift(Long id, DoctorShiftDTO dto) {
        DoctorShift shift = doctorShiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found with id: " + id));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));

        shift.setDoctor(doctor);
        shift.setDayOfWeek(dto.getDayOfWeek());
        shift.setStartTime(dto.getStartTime());
        shift.setEndTime(dto.getEndTime());
        shift.setDepartment(dto.getDepartment());
        shift.setStatus(dto.getStatus() != null ? dto.getStatus() : ShiftStatus.ACTIVE);

        DoctorShift updatedShift = doctorShiftRepository.save(shift);
        DoctorShiftDTO result = mapToDTO(updatedShift);

        // Real-time broadcast
        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(NotificationMessage.Type.SHIFT_UPDATED)
                .title("Shift Schedule Updated")
                .message(String.format("Shift updated for Dr. %s on %s", doctor.getName(), updatedShift.getDayOfWeek()))
                .entityId(updatedShift.getId())
                .build());

        return result;
    }

    @Override
    public List<DoctorShiftDTO> getAllShifts() {
        return doctorShiftRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DoctorShiftDTO> getShiftsByDoctorId(Long doctorId) {
        return doctorShiftRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DoctorShiftDTO> getShiftsByDepartment(String department) {
        return doctorShiftRepository.findByDepartment(department).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteShift(Long id) {
        DoctorShift shift = doctorShiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found with id: " + id));
        doctorShiftRepository.delete(shift);

        // Real-time broadcast
        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(NotificationMessage.Type.SHIFT_UPDATED)
                .title("Shift Schedule Cancelled")
                .message(String.format("Shift #%d has been removed", id))
                .entityId(id)
                .build());
    }

    private DoctorShiftDTO mapToDTO(DoctorShift shift) {
        return DoctorShiftDTO.builder()
                .id(shift.getId())
                .doctorId(shift.getDoctor().getId())
                .doctorName(shift.getDoctor().getName())
                .dayOfWeek(shift.getDayOfWeek())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .department(shift.getDepartment())
                .status(shift.getStatus())
                .build();
    }

    private DoctorShift mapToEntity(DoctorShiftDTO dto, Doctor doctor) {
        return DoctorShift.builder()
                .id(dto.getId())
                .doctor(doctor)
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .department(dto.getDepartment())
                .status(dto.getStatus())
                .build();
    }
}
