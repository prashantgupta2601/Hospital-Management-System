package com.hms.modules.analytics.service.impl;

import com.hms.modules.analytics.dto.*;
import com.hms.modules.analytics.service.AnalyticsService;
import com.hms.modules.appointment.repository.AppointmentRepository;
import com.hms.modules.billing.repository.BillingRepository;
import com.hms.modules.billing.entity.PaymentStatus;
import com.hms.modules.doctor.repository.DoctorRepository;
import com.hms.modules.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillingRepository billingRepository;

    @Override
    public List<AppointmentsPerDayDTO> getAppointmentsPerDay() {
        return appointmentRepository.getAppointmentsPerDay();
    }

    @Override
    public List<DoctorWorkloadDTO> getDoctorWorkload() {
        return appointmentRepository.getDoctorWorkload();
    }

    @Override
    public List<PatientGrowthDTO> getPatientGrowth() {
        return patientRepository.getPatientGrowth();
    }

    @Override
    public DashboardStatsDTO getDashboardStats() {
        Long totalPatients = patientRepository.count();
        Long activeDoctors = doctorRepository.count();
        Long totalAppointments = appointmentRepository.count();
        BigDecimal totalRevenue = billingRepository.sumRevenueByStatus(PaymentStatus.PAID);

        return new DashboardStatsDTO(totalPatients, activeDoctors, totalAppointments, totalRevenue);
    }

    @Override
    public AnalyticsSummaryDTO getAnalyticsSummary() {
        DashboardStatsDTO stats = getDashboardStats();
        List<AppointmentsPerDayDTO> appointmentsPerDay = getAppointmentsPerDay();
        List<DoctorWorkloadDTO> doctorWorkload = getDoctorWorkload();
        List<PatientGrowthDTO> patientGrowth = getPatientGrowth();

        return new AnalyticsSummaryDTO(stats, appointmentsPerDay, doctorWorkload, patientGrowth);
    }
}
