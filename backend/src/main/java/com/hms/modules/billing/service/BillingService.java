package com.hms.modules.billing.service;

import com.hms.modules.billing.dto.BillingDTO;
import java.util.List;

public interface BillingService {
    BillingDTO createInvoice(BillingDTO billingDTO);
    BillingDTO getBillingById(Long id);
    List<BillingDTO> getAllBillings();
    List<BillingDTO> getBillingsByPatientId(Long patientId);
    BillingDTO updatePaymentStatus(Long id, String status);
}
