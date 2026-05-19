package com.hms.modules.billing.repository;

import com.hms.modules.billing.entity.Billing;
import com.hms.modules.billing.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingRepository extends JpaRepository<Billing, Long> {
    List<Billing> findByPatientId(Long patientId);
    Optional<Billing> findByAppointmentId(Long appointmentId);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Billing b WHERE b.paymentStatus = :status")
    BigDecimal sumRevenueByStatus(@Param("status") PaymentStatus status);
}
