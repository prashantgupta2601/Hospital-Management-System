package com.hms.modules.appointment.repository;

import com.hms.modules.appointment.entity.Appointment;
import com.hms.modules.analytics.dto.AppointmentsPerDayDTO;
import com.hms.modules.analytics.dto.DoctorWorkloadDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorId(Long doctorId);

    @Query("SELECT new com.hms.modules.analytics.dto.AppointmentsPerDayDTO(FUNCTION('DATE', a.appointmentDate), COUNT(a)) " +
           "FROM Appointment a " +
           "GROUP BY FUNCTION('DATE', a.appointmentDate) " +
           "ORDER BY FUNCTION('DATE', a.appointmentDate) ASC")
    List<AppointmentsPerDayDTO> getAppointmentsPerDay();

    @Query("SELECT new com.hms.modules.analytics.dto.DoctorWorkloadDTO(d.name, COUNT(a)) " +
           "FROM Appointment a " +
           "JOIN a.doctor d " +
           "GROUP BY d.id, d.name " +
           "ORDER BY COUNT(a) DESC")
    List<DoctorWorkloadDTO> getDoctorWorkload();
}
