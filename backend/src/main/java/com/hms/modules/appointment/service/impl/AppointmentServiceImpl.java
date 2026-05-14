package com.hms.modules.appointment.service.impl;

import com.hms.modules.appointment.dto.AppointmentDTO;
import com.hms.modules.appointment.entity.Appointment;
import com.hms.modules.appointment.entity.AppointmentStatus;
import com.hms.modules.doctor.entity.Doctor;
import com.hms.modules.patient.entity.Patient;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.modules.appointment.repository.AppointmentRepository;
import com.hms.modules.doctor.repository.DoctorRepository;
import com.hms.modules.patient.repository.PatientRepository;
import com.hms.modules.appointment.service.AppointmentService;
import com.hms.modules.notification.dto.NotificationMessage;
import com.hms.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    @Override
    public AppointmentDTO createAppointment(AppointmentDTO appointmentDTO) {
        Patient patient = patientRepository.findById(appointmentDTO.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + appointmentDTO.getPatientId()));

        Doctor doctor = doctorRepository.findById(appointmentDTO.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + appointmentDTO.getDoctorId()));

        Appointment appointment = mapToEntity(appointmentDTO, patient, doctor);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        Appointment savedAppointment = appointmentRepository.save(appointment);
        AppointmentDTO result = mapToDTO(savedAppointment);

        // ── Real-time notification ──────────────────────────────────────────
        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(NotificationMessage.Type.APPOINTMENT_CREATED)
                .title("New Appointment Booked")
                .message(String.format("Appointment booked for %s with Dr. %s",
                        patient.getName(), doctor.getName()))
                .entityId(savedAppointment.getId())
                .build());

        return result;
    }

    @Override
    public AppointmentDTO getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        return mapToDTO(appointment);
    }

    @Override
    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDTO> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDTO> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AppointmentDTO updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        AppointmentStatus newStatus = AppointmentStatus.valueOf(status.toUpperCase());
        appointment.setStatus(newStatus);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        AppointmentDTO result = mapToDTO(updatedAppointment);

        // ── Real-time notification ──────────────────────────────────────────
        NotificationMessage.Type notifType = switch (newStatus) {
            case COMPLETED  -> NotificationMessage.Type.APPOINTMENT_COMPLETED;
            case CANCELLED  -> NotificationMessage.Type.APPOINTMENT_CANCELLED;
            default         -> NotificationMessage.Type.APPOINTMENT_UPDATED;
        };

        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(notifType)
                .title("Appointment Status Changed")
                .message(String.format("Appointment #%d status updated to %s", id, newStatus))
                .entityId(id)
                .build());

        return result;
    }

    @Override
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointmentRepository.delete(appointment);

        // ── Real-time notification ──────────────────────────────────────────
        notificationService.broadcastAppointmentUpdate(NotificationMessage.builder()
                .type(NotificationMessage.Type.APPOINTMENT_CANCELLED)
                .title("Appointment Removed")
                .message(String.format("Appointment #%d has been deleted", id))
                .entityId(id)
                .build());
    }

    private AppointmentDTO mapToDTO(Appointment appointment) {
        return AppointmentDTO.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getName())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getName())
                .appointmentDate(appointment.getAppointmentDate())
                .status(appointment.getStatus())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }

    private Appointment mapToEntity(AppointmentDTO dto, Patient patient, Doctor doctor) {
        return Appointment.builder()
                .id(dto.getId())
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(dto.getAppointmentDate())
                .status(dto.getStatus())
                .notes(dto.getNotes())
                .build();
    }
}
