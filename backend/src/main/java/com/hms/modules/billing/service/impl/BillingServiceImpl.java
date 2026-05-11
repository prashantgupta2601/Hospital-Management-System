package com.hms.modules.billing.service.impl;

import com.hms.modules.billing.dto.BillingDTO;
import com.hms.modules.appointment.entity.Appointment;
import com.hms.modules.billing.entity.Billing;
import com.hms.modules.patient.entity.Patient;
import com.hms.modules.billing.entity.PaymentStatus;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.modules.appointment.repository.AppointmentRepository;
import com.hms.modules.billing.repository.BillingRepository;
import com.hms.modules.patient.repository.PatientRepository;
import com.hms.modules.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    public BillingDTO createInvoice(BillingDTO billingDTO) {
        Patient patient = patientRepository.findById(billingDTO.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + billingDTO.getPatientId()));
        
        Appointment appointment = appointmentRepository.findById(billingDTO.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + billingDTO.getAppointmentId()));

        Billing billing = Billing.builder()
                .patient(patient)
                .appointment(appointment)
                .amount(billingDTO.getAmount())
                .paymentStatus(PaymentStatus.PENDING)
                .invoiceDate(LocalDateTime.now())
                .build();
        
        Billing savedBilling = billingRepository.save(billing);
        return mapToDTO(savedBilling);
    }

    @Override
    public BillingDTO getBillingById(Long id) {
        Billing billing = billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Billing not found with id: " + id));
        return mapToDTO(billing);
    }

    @Override
    public List<BillingDTO> getAllBillings() {
        return billingRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BillingDTO> getBillingsByPatientId(Long patientId) {
        return billingRepository.findByPatientId(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BillingDTO updatePaymentStatus(Long id, String status) {
        Billing billing = billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Billing not found with id: " + id));
        
        billing.setPaymentStatus(PaymentStatus.valueOf(status.toUpperCase()));
        Billing updatedBilling = billingRepository.save(billing);
        return mapToDTO(updatedBilling);
    }

    private BillingDTO mapToDTO(Billing billing) {
        return BillingDTO.builder()
                .id(billing.getId())
                .patientId(billing.getPatient().getId())
                .patientName(billing.getPatient().getName())
                .appointmentId(billing.getAppointment().getId())
                .amount(billing.getAmount())
                .paymentStatus(billing.getPaymentStatus())
                .invoiceDate(billing.getInvoiceDate())
                .createdAt(billing.getCreatedAt())
                .updatedAt(billing.getUpdatedAt())
                .build();
    }
}
